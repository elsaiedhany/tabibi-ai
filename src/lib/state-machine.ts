import { db } from "./db";
import { ConversationState, IntentType, AppointmentStatus } from "../types/index";
import { normalizeText } from "./arabic";
import { checkDoctorAvailability, isSlotAvailable, formatArabicTime } from "./calendar";

export interface StateMachineResult {
  nextState: ConversationState;
  responseMessage: string;
  isHandled: boolean;
  appointmentBooked?: boolean;
}

export function parseEgyptianRelativeDate(text: string): string | null {
  const norm = normalizeText(text);
  const today = new Date();

  if (norm.includes("بكره") || norm.includes("بكرة") || norm.includes("غدا")) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }

  if (norm.includes("النهارده") || norm.includes("اليوم")) {
    return today.toISOString().split("T")[0];
  }

  const daysNorm = [
    { key: "احد", dayIndex: 0 },
    { key: "ثنين", dayIndex: 1 },
    { key: "ثلاثاء", dayIndex: 2 },
    { key: "اربعاء", dayIndex: 3 },
    { key: "خميس", dayIndex: 4 },
    { key: "جمعة", dayIndex: 5 },
    { key: "جمعه", dayIndex: 5 },
    { key: "سبت", dayIndex: 6 },
  ];

  for (const item of daysNorm) {
    if (norm.includes(item.key)) {
      const currentDayIndex = today.getDay();
      let diff = (item.dayIndex - currentDayIndex + 7) % 7;
      if (diff === 0) diff = 7;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + diff);
      return targetDate.toISOString().split("T")[0];
    }
  }

  return null;
}

export async function processStateMachine(
  doctorId: string,
  conversationId: string,
  patientId: string,
  currentState: ConversationState,
  userText: string,
  detectedIntent: IntentType
): Promise<StateMachineResult> {
  const normText = normalizeText(userText);

  const conversation = await db.conversation.findUnique({ where: { id: conversationId } });
  const patient = await db.patient.findUnique({ where: { id: patientId } });
  const doctor = await db.doctor.findUnique({ where: { id: doctorId } });

  if (!conversation || !patient || !doctor) {
    return { nextState: ConversationState.IDLE, responseMessage: "", isHandled: false };
  }

  // Cancel/Exit mid-flow
  if (normText === "إلغاء" || normText === "الغي" || normText === "بلاش" || normText === "خروج" || normText === "الغيه") {
    await db.conversation.update({
      where: { id: conversationId },
      data: {
        state: ConversationState.IDLE,
        currentServiceId: null,
        selectedDate: null,
        selectedTime: null,
      },
    });
    return {
      nextState: ConversationState.IDLE,
      responseMessage: "تمام جداً، تم إلغاء خطوة الحجز بناءً على طلبك. لو احتاجت أي حاجة تانية أنا في الخدمة دايماً! 😊",
      isHandled: true,
    };
  }

  switch (currentState) {
    // ----------------------------------------------------
    // STATE: IDLE -> Initiate Booking, Reschedule, or Cancel
    // ----------------------------------------------------
    case ConversationState.IDLE: {
      if (detectedIntent === IntentType.BOOK_APPOINTMENT) {
        await db.conversation.update({
          where: { id: conversationId },
          data: { state: ConversationState.SELECT_SERVICE },
        });
        return await getServicesPrompt(doctorId);
      }

      if (detectedIntent === IntentType.RESCHEDULE_APPOINTMENT) {
        const activeApp = await db.appointment.findFirst({
          where: { doctorId, patientId, status: "SCHEDULED" },
          include: { service: true },
        });

        if (!activeApp) {
          return {
            nextState: ConversationState.IDLE,
            responseMessage: `أهلاً بك! مفيش حجز قائم باسمك حالياً مع د. ${doctor.name}. تحب أسجلك ميعاد جديد؟`,
            isHandled: true,
          };
        }

        await db.conversation.update({
          where: { id: conversationId },
          data: {
            state: ConversationState.RESCHEDULING_SELECT_TIME,
            currentServiceId: activeApp.serviceId,
          },
        });

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split("T")[0];

        const slots = await checkDoctorAvailability(doctorId, dateStr);
        const availSlots = slots.filter((s) => s.available);

        let msg = `حجزك الحالي مع د. ${doctor.name} يوم ${activeApp.date} الساعة ${formatArabicTime(activeApp.time)}.\n\nالمواعيد المتاحة ليوم غد (${dateStr}):\n`;
        availSlots.slice(0, 5).forEach((s, idx) => {
          msg += `${idx + 1}. ${s.displayTime}\n`;
        });
        msg += "\nاكتب رقم الموعد الجديد المناسب لك:";

        return { nextState: ConversationState.RESCHEDULING_SELECT_TIME, responseMessage: msg, isHandled: true };
      }

      if (detectedIntent === IntentType.CANCEL_APPOINTMENT) {
        const activeApp = await db.appointment.findFirst({
          where: { doctorId, patientId, status: "SCHEDULED" },
        });

        if (!activeApp) {
          return {
            nextState: ConversationState.IDLE,
            responseMessage: `أهلاً بك! مفيش أي حجز قائم باسمك حالياً مع د. ${doctor.name} عشان نلغيه.`,
            isHandled: true,
          };
        }

        await db.conversation.update({
          where: { id: conversationId },
          data: { state: ConversationState.CANCELLING_CONFIRM },
        });

        return {
          nextState: ConversationState.CANCELLING_CONFIRM,
          responseMessage: `تأكيد إلغاء الحجز: هل تحب تلغي ميعادك مع د. ${doctor.name} يوم ${activeApp.date} الساعة ${formatArabicTime(activeApp.time)}؟\n\nاكتب (نعم) للإلغاء أو (لا) للاحتفاظ بالميعاد.`,
          isHandled: true,
        };
      }

      break;
    }

    // ----------------------------------------------------
    // STATE: SELECT_SERVICE
    // ----------------------------------------------------
    case ConversationState.SELECT_SERVICE: {
      const services = await db.service.findMany({ where: { doctorId, isActive: true } });

      let selectedServiceId: string | null = null;
      let selectedServiceName = `كشف ${doctor.specialty}`;
      let selectedPrice = doctor.consultationPrice;

      const num = parseInt(normText, 10);
      if (num === 1 || normText.includes("كشف") || normText.includes("جلدية") || normText.includes("اسنان")) {
        selectedServiceName = `كشف ${doctor.specialty}`;
        selectedPrice = doctor.consultationPrice;
      } else if (num === 2 || normText.includes("متابعة") || normText.includes("اعادة")) {
        selectedServiceName = `متابعة كشف`;
        selectedPrice = doctor.followupPrice;
      } else if (!isNaN(num) && num > 2 && num - 3 < services.length) {
        const srv = services[num - 3];
        selectedServiceId = srv.id;
        selectedServiceName = srv.name;
        selectedPrice = srv.price;
      } else {
        const matchedSrv = services.find((s) => normText.includes(normalizeText(s.name)));
        if (matchedSrv) {
          selectedServiceId = matchedSrv.id;
          selectedServiceName = matchedSrv.name;
          selectedPrice = matchedSrv.price;
        }
      }

      if (!selectedServiceId) {
        let matchSrv = services.find((s) => s.name.includes(selectedServiceName));
        if (!matchSrv) {
          matchSrv = await db.service.create({
            data: {
              doctorId,
              name: selectedServiceName,
              price: selectedPrice,
              durationMinutes: 30,
            },
          });
        }
        selectedServiceId = matchSrv.id;
      }

      // Check if user specified a relative date in the same message (e.g. "كشف جلدية بكرة" or "الخميس")
      let dateStr = parseEgyptianRelativeDate(userText);
      if (!dateStr) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateStr = tomorrow.toISOString().split("T")[0];
      }

      await db.conversation.update({
        where: { id: conversationId },
        data: {
          state: ConversationState.SELECT_TIME,
          currentServiceId: selectedServiceId,
          selectedDate: dateStr,
        },
      });

      const slots = await checkDoctorAvailability(doctorId, dateStr);
      const availSlots = slots.filter((s) => s.available);

      let msg = `تمام جداً! اخترت (${selectedServiceName} - ${selectedPrice} ج.م).\n\nالمواعيد المتاحة يوم (${dateStr}) مع د. ${doctor.name}:\n`;
      availSlots.slice(0, 6).forEach((s, idx) => {
        msg += `${idx + 1}. ${s.displayTime}\n`;
      });
      msg += "\nأنهي ميعاد أنسب لحضرتك؟ (اكتب رقم الميعاد):";

      return { nextState: ConversationState.SELECT_TIME, responseMessage: msg, isHandled: true };
    }

    // ----------------------------------------------------
    // STATE: SELECT_TIME
    // ----------------------------------------------------
    case ConversationState.SELECT_TIME: {
      // Check if user wants to change date mid-booking (e.g., "خليها الخميس بدل بكرة")
      const newDate = parseEgyptianRelativeDate(userText);
      if (newDate) {
        await db.conversation.update({
          where: { id: conversationId },
          data: { selectedDate: newDate },
        });

        const slots = await checkDoctorAvailability(doctorId, newDate);
        const availSlots = slots.filter((s) => s.available);

        let msg = `تمام، غيرنا اليوم ليوم (${newDate}).\n\nالمواعيد المتاحة مع د. ${doctor.name}:\n`;
        availSlots.slice(0, 6).forEach((s, idx) => {
          msg += `${idx + 1}. ${s.displayTime}\n`;
        });
        msg += "\nاكتب رقم الميعاد المناسب لك:";

        return { nextState: ConversationState.SELECT_TIME, responseMessage: msg, isHandled: true };
      }

      let dateStr = conversation.selectedDate;
      if (!dateStr) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateStr = tomorrow.toISOString().split("T")[0];
      }

      const slots = await checkDoctorAvailability(doctorId, dateStr);
      const availSlots = slots.filter((s) => s.available);

      let chosenTime: string | null = null;
      const num = parseInt(normText, 10);

      if (!isNaN(num) && num >= 1 && num <= availSlots.length) {
        chosenTime = availSlots[num - 1].time;
      } else {
        // Time preference string matching (e.g. "بعد 6", "الساعة 7", "بعد العصر")
        if (normText.includes("6") || normText.includes("ستة") || normText.includes("18")) {
          const match = availSlots.find((s) => s.time >= "18:00");
          if (match) chosenTime = match.time;
        } else if (normText.includes("7") || normText.includes("سبعة") || normText.includes("19")) {
          const match = availSlots.find((s) => s.time >= "19:00");
          if (match) chosenTime = match.time;
        } else {
          const match = availSlots.find((s) => s.time.includes(normText) || s.displayTime.includes(normText));
          if (match) chosenTime = match.time;
        }
      }

      if (!chosenTime) {
        let msg = `الميعاد ده مش متاح للأسف، بس عندي المواعيد دي يوم (${dateStr}):\n`;
        availSlots.slice(0, 4).forEach((s, idx) => {
          msg += `${idx + 1}. ${s.displayTime}\n`;
        });
        msg += "\nأنهي ميعاد أنسب لحضرتك؟ (اكتب الرقم):";
        return {
          nextState: ConversationState.SELECT_TIME,
          responseMessage: msg,
          isHandled: true,
        };
      }

      await db.conversation.update({
        where: { id: conversationId },
        data: { selectedTime: chosenTime },
      });

      if (!patient.name || patient.name.trim().length < 3 || patient.name.startsWith("مريض")) {
        await db.conversation.update({
          where: { id: conversationId },
          data: { state: ConversationState.COLLECT_NAME },
        });

        return {
          nextState: ConversationState.COLLECT_NAME,
          responseMessage: "تمام جداً 👍 من فضلك اكتب اسمك الثلاثي لتأكيد الملف المباشر بالعيادة:",
          isHandled: true,
        };
      }

      return await getConfirmationPrompt(doctorId, conversationId, patient.name);
    }

    // ----------------------------------------------------
    // STATE: COLLECT_NAME
    // ----------------------------------------------------
    case ConversationState.COLLECT_NAME: {
      const patientName = userText.trim();
      if (patientName.length < 3) {
        return {
          nextState: ConversationState.COLLECT_NAME,
          responseMessage: "من فضلك اكتب الاسم بشكل واضح وتفصيلي لتأكيد الملف بالعيادة.",
          isHandled: true,
        };
      }

      await db.patient.update({
        where: { id: patientId },
        data: { name: patientName },
      });

      return await getConfirmationPrompt(doctorId, conversationId, patientName);
    }

    // ----------------------------------------------------
    // STATE: CONFIRM_BOOKING
    // ----------------------------------------------------
    case ConversationState.CONFIRM_BOOKING: {
      if (detectedIntent === IntentType.CONFIRMATION || normText.includes("نعم") || normText.includes("تأكيد") || normText.includes("ايوه") || normText.includes("ماشي") || normText.includes("تمام")) {
        const { currentServiceId, selectedDate, selectedTime } = conversation;

        if (!currentServiceId || !selectedDate || !selectedTime) {
          return resetToIdle(conversationId);
        }

        const bookingResult = await db.$transaction(async (tx) => {
          const existingSlot = await tx.appointment.findFirst({
            where: {
              doctorId,
              date: selectedDate,
              time: selectedTime,
              status: { in: ["SCHEDULED", "RESCHEDULED"] },
            },
          });

          if (existingSlot) {
            return null;
          }

          return await tx.appointment.create({
            data: {
              doctorId,
              patientId,
              serviceId: currentServiceId,
              conversationId,
              date: selectedDate,
              time: selectedTime,
              status: AppointmentStatus.SCHEDULED,
            },
            include: { service: true, doctor: true },
          });
        });

        if (!bookingResult) {
          await db.conversation.update({
            where: { id: conversationId },
            data: { state: ConversationState.SELECT_TIME },
          });
          return {
            nextState: ConversationState.SELECT_TIME,
            responseMessage: "عذراً الميعاد ده تم حجزه للتو من مريض آخر. يرجى اختيار موعد آخر متاح.",
            isHandled: true,
          };
        }

        const app = bookingResult;

        await db.conversation.update({
          where: { id: conversationId },
          data: {
            state: ConversationState.IDLE,
            currentServiceId: null,
            selectedDate: null,
            selectedTime: null,
          },
        });

        const confirmMsg = `✅ **تم تأكيد حجزك بنجاح!**\n\n📌 **تفاصيل الموعد:**\n- المريض: ${patient.name}\n- الطبيب: د. ${doctor.name} (${doctor.specialty})\n- الخدمة: ${app.service.name}\n- الموعد: ${app.date} الساعة ${formatArabicTime(app.time)}\n- السعر: ${app.service.price} ج.م\n\nهنبعتلك تذكير قبل الموعد بـ 24 ساعة. نتمنى لك دوام الصحة والعافية! ❤️`;

        return {
          nextState: ConversationState.IDLE,
          responseMessage: confirmMsg,
          isHandled: true,
          appointmentBooked: true,
        };
      }

      if (detectedIntent === IntentType.REJECTION || normText.includes("لا") || normText.includes("إلغاء")) {
        return resetToIdle(conversationId, "تمام جداً، تم إلغاء الحجز بناءً على طلبك.");
      }

      return {
        nextState: ConversationState.CONFIRM_BOOKING,
        responseMessage: "من فضلك اكتب (نعم) لتأكيد الحجز النهائي أو (لا) للإلغاء.",
        isHandled: true,
      };
    }

    // ----------------------------------------------------
    // STATE: RESCHEDULING_SELECT_TIME
    // ----------------------------------------------------
    case ConversationState.RESCHEDULING_SELECT_TIME: {
      const activeApp = await db.appointment.findFirst({
        where: { doctorId, patientId, status: "SCHEDULED" },
      });

      if (!activeApp) return resetToIdle(conversationId);

      const dateStr = activeApp.date;
      const slots = await checkDoctorAvailability(doctorId, dateStr);
      const availSlots = slots.filter((s) => s.available);

      let chosenTime: string | null = null;
      const num = parseInt(normText, 10);

      if (!isNaN(num) && num >= 1 && num <= availSlots.length) {
        chosenTime = availSlots[num - 1].time;
      }

      if (!chosenTime) {
        return {
          nextState: ConversationState.RESCHEDULING_SELECT_TIME,
          responseMessage: "يرجى اختيار رقم موعد صحيح من القائمة المتاحة لتعديل حجزك.",
          isHandled: true,
        };
      }

      await db.appointment.update({
        where: { id: activeApp.id },
        data: { time: chosenTime },
      });

      await db.conversation.update({
        where: { id: conversationId },
        data: { state: ConversationState.IDLE, currentServiceId: null },
      });

      return {
        nextState: ConversationState.IDLE,
        responseMessage: `✅ تم تعديل ميعاد حجزك بنجاح مع د. ${doctor.name} ليصبح يوم ${activeApp.date} الساعة ${formatArabicTime(chosenTime)}.`,
        isHandled: true,
      };
    }

    // ----------------------------------------------------
    // STATE: CANCELLING_CONFIRM
    // ----------------------------------------------------
    case ConversationState.CANCELLING_CONFIRM: {
      if (detectedIntent === IntentType.CONFIRMATION || normText.includes("نعم") || normText.includes("تأكيد") || normText.includes("ايوه")) {
        const activeApp = await db.appointment.findFirst({
          where: { doctorId, patientId, status: "SCHEDULED" },
        });

        if (activeApp) {
          await db.appointment.update({
            where: { id: activeApp.id },
            data: { status: AppointmentStatus.CANCELLED },
          });
        }

        return resetToIdle(conversationId, "✅ تم إلغاء حجزك بنجاح. يمكنك طلب حجز جديد في أي وقت.");
      }

      if (detectedIntent === IntentType.REJECTION || normText.includes("لا")) {
        return resetToIdle(conversationId, "تمام، تم الاحتفاظ بحجزك الحالي دون تغيير.");
      }

      return {
        nextState: ConversationState.CANCELLING_CONFIRM,
        responseMessage: "من فضلك اكتب (نعم) لتأكيد الإلغاء أو (لا) للاحتفاظ بالحجز.",
        isHandled: true,
      };
    }

    default:
      return { nextState: ConversationState.IDLE, responseMessage: "", isHandled: false };
  }

  return { nextState: ConversationState.IDLE, responseMessage: "", isHandled: false };
}

async function getServicesPrompt(doctorId: string): Promise<StateMachineResult> {
  const doctor = await db.doctor.findUnique({ where: { id: doctorId } });
  const services = await db.service.findMany({ where: { doctorId, isActive: true } });

  let msg = `أهلاً بك! يسعدنا خدمتك بالعيادة مع د. ${doctor?.name || "الدكتور"}.\n\nالخدمات المتاحة:\n`;
  msg += `1. كشف ${doctor?.specialty || "رئيسي"} (${doctor?.consultationPrice || 500} ج.م)\n`;
  msg += `2. متابعة كشف (${doctor?.followupPrice || 300} ج.م)\n`;

  services.forEach((s, idx) => {
    msg += `${idx + 3}. ${s.name} (${s.price} ج.م)\n`;
  });

  msg += "\nمن فضلك اكتب رقم الخدمة المطلوب حجزها:";

  return {
    nextState: ConversationState.SELECT_SERVICE,
    responseMessage: msg,
    isHandled: true,
  };
}

async function getConfirmationPrompt(doctorId: string, conversationId: string, patientName: string): Promise<StateMachineResult> {
  const conversation = await db.conversation.findUnique({ where: { id: conversationId } });
  const doctor = await db.doctor.findUnique({ where: { id: doctorId } });

  if (!conversation || !conversation.currentServiceId || !conversation.selectedDate || !conversation.selectedTime) {
    return resetToIdle(conversationId);
  }

  const service = await db.service.findUnique({ where: { id: conversation.currentServiceId } });
  const serviceName = service ? service.name : `كشف ${doctor?.specialty}`;
  const price = service ? service.price : doctor?.consultationPrice;

  await db.conversation.update({
    where: { id: conversationId },
    data: { state: ConversationState.CONFIRM_BOOKING },
  });

  const msg = `📌 **ملخص بيانات الحجز:**\n- الاسم: ${patientName}\n- الطبيب: د. ${doctor?.name}\n- الخدمة: ${serviceName}\n- الموعد: ${conversation.selectedDate} الساعة ${formatArabicTime(conversation.selectedTime)}\n- السعر: ${price} ج.م\n\nهل ترغب في تأكيد هذا الموعد النهائي؟ (اكتب **نعم** للتأكيد أو **لا** للإلغاء):`;

  return {
    nextState: ConversationState.CONFIRM_BOOKING,
    responseMessage: msg,
    isHandled: true,
  };
}

async function resetToIdle(conversationId: string, message: string = ""): Promise<StateMachineResult> {
  await db.conversation.update({
    where: { id: conversationId },
    data: {
      state: ConversationState.IDLE,
      currentServiceId: null,
      selectedDate: null,
      selectedTime: null,
    },
  });

  return {
    nextState: ConversationState.IDLE,
    responseMessage: message,
    isHandled: true,
  };
}
