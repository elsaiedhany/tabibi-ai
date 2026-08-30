import { db } from "./db";
import { IntentType } from "../types/index";

export async function getTemplateResponse(
  doctorId: string,
  intent: IntentType
): Promise<string | null> {
  const doctor = await db.doctor.findUnique({
    where: { id: doctorId },
    include: { settings: true, services: true, locations: true },
  });

  if (!doctor) return null;

  switch (intent) {
    case IntentType.GREETING:
      return (
        doctor.settings?.greetingTemplate?.replace("{doctor_name}", doctor.name) ||
        `أهلاً بحضرتك 👋 أنا مريم، المساعدة الذكية الخاصة بـ ${doctor.name} (${doctor.specialty}). إزاي أقدر أساعدك؟`
      );

    case IntentType.WORKING_HOURS:
      return (
        doctor.settings?.workingHoursTemplate?.replace("{doctor_name}", doctor.name).replace("{working_hours}", doctor.workingHours) ||
        `مواعيد د. ${doctor.name}: ${doctor.workingHours}.`
      );

    case IntentType.LOCATION: {
      if (doctor.locations.length === 0) {
        return `📍 **عنوان عيادة د. ${doctor.name}:**\nالعيادة الرئيسية. يشرفنا زيارتكم!`;
      }
      let locStr = `📍 **عناوين وفروع د. ${doctor.name}:**\n\n`;
      doctor.locations.forEach((loc) => {
        locStr += `• **${loc.name}**: ${loc.address}\n`;
      });
      return locStr;
    }

    case IntentType.PHONE:
      return `📞 **رقم التواتصل والواتساب الخاص بـ د. ${doctor.name}:**\n${doctor.whatsappNumber}`;

    case IntentType.DOCTORS:
      return `👨‍⚕️ **الدكتور:** ${doctor.name}\n• التخصص: ${doctor.specialty}\n• الدرجة العلمية: ${doctor.title}\n• الخبرة: ${doctor.experienceYears} سنة\n\nلحجز موعد اكتب: "عايز احجز"`;

    case IntentType.SERVICES: {
      let srvList = `🩺 **الخدمات المتاحة مع د. ${doctor.name}:**\n\n`;
      srvList += `• كشف رئيسي: ${doctor.consultationPrice} ج.م\n`;
      srvList += `• متابعة: ${doctor.followupPrice} ج.م\n`;
      doctor.services.forEach((s) => {
        srvList += `• ${s.name}: ${s.price} ج.م (${s.durationMinutes} دقيقة)\n`;
      });
      srvList += `\nلحجز أي خدمة اكتب: "عايز احجز"`;
      return srvList;
    }

    case IntentType.PRICES: {
      let priceList = `💰 **أسعار الكشف والخدمات لـ د. ${doctor.name}:**\n\n`;
      priceList += `• **سعر الكشف**: ${doctor.consultationPrice} ج.م\n`;
      priceList += `• **سعر المتابعة**: ${doctor.followupPrice} ج.م\n`;
      doctor.services.forEach((s) => {
        priceList += `• **${s.name}**: ${s.price} ج.م\n`;
      });
      priceList += `\nيمكنك حجز موعد الآن بكتابة: "احجز لي موعد"`;
      return priceList;
    }

    case IntentType.THANK_YOU:
      return "الشكر لله دائماً! في خدمتك في أي وقت، ونتمنى لك دوام الصحة والعافية مع د. " + doctor.name + " ❤️";

    case IntentType.GOODBYE:
      return "مع السلامة! يومك سعيد وبانتظار زيارتك للعيادة 👋";

    case IntentType.HUMAN_HANDOFF:
      return (
        doctor.settings?.handoffTemplate ||
        "تمام، تم تحويل المحادثة لمساعد الاستقبال الخاص بالدكتور وسيقوم بالرد عليك في أقرب وقت."
      );

    default:
      return null;
  }
}
