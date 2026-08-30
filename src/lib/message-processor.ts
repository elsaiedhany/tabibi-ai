import { db } from "./db";
import { normalizeText } from "./arabic";
import { detectIntent, StructuredIntentResult } from "./intent";
import { processStateMachine } from "./state-machine";
import { matchFaqOrKnowledgeBase } from "./faq-cache";
import { getTemplateResponse } from "./templates";
import { checkMedicalSafety } from "./medical-safety";
import { queryDoctorLlm } from "./llm";
import { sendWhatsAppTextMessage } from "./whatsapp";
import { HandoffStatus, ConversationState, IntentType } from "../types/index";

export interface ProcessMessageInput {
  doctorId: string;
  patientPhone: string;
  rawText: string;
  mediaType?: string;
  whatsappMessageId?: string;
}

export interface ProcessMessageOutput {
  replyText: string;
  handledBy: "STATE_MACHINE" | "RULE_TEMPLATE" | "FAQ_CACHE" | "MEDICAL_SAFETY" | "LLM" | "HUMAN_TAKEOVER" | "MULTI_INTENT";
  intent: IntentType;
  conversationState: ConversationState;
  handoffStatus: HandoffStatus;
  aiCost: number;
}

export async function processIncomingPatientMessage(
  input: ProcessMessageInput
): Promise<ProcessMessageOutput> {
  const { doctorId, patientPhone, rawText, whatsappMessageId } = input;
  let aiCost = 0;

  // 1. Identify Patient for Doctor (or create if new patient for this doctor)
  let patient = await db.patient.findUnique({
    where: { doctorId_whatsappNumber: { doctorId, whatsappNumber: patientPhone } },
  });

  if (!patient) {
    patient = await db.patient.create({
      data: {
        doctorId,
        whatsappNumber: patientPhone,
        name: `مريض (${patientPhone.slice(-4)})`,
      },
    });
  }

  // 2. Identify / Load Conversation State for Doctor
  let conversation = await db.conversation.findFirst({
    where: { doctorId, patientId: patient.id },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        doctorId,
        patientId: patient.id,
        state: ConversationState.IDLE,
        handoffStatus: HandoffStatus.AI_ACTIVE,
      },
    });
  }

  const normText = normalizeText(rawText);
  const detected: StructuredIntentResult = detectIntent(rawText);

  await db.message.create({
    data: {
      conversationId: conversation.id,
      sender: "PATIENT",
      content: rawText,
      normalizedText: normText,
      detectedIntent: detected.intent,
      status: "received",
      whatsappId: whatsappMessageId,
    },
  });

  await db.conversation.update({
    where: { id: conversation.id },
    data: { lastIntent: detected.intent },
  });

  // 3. Human Active Guardrail: If Receptionist took over, suppress AI reply
  if (conversation.handoffStatus === HandoffStatus.HUMAN_ACTIVE) {
    return {
      replyText: "[تم استلام الرسالة، المحادثة تحت يد مساعد الاستقبال الخاص بالدكتور]",
      handledBy: "HUMAN_TAKEOVER",
      intent: detected.intent,
      conversationState: conversation.state as ConversationState,
      handoffStatus: conversation.handoffStatus as HandoffStatus,
      aiCost: 0,
    };
  }

  let finalReplyText = "";
  let handledBy: ProcessMessageOutput["handledBy"] = "RULE_TEMPLATE";

  // 4. Medical Safety & Emergency Check
  const safety = checkMedicalSafety(rawText);
  if (safety.isEmergency || safety.isMedicalDiagnosis) {
    finalReplyText = safety.safetyResponse || "تم تحويل المحادثة للفريق الطبي بالعيادة.";
    handledBy = "MEDICAL_SAFETY";

    await db.conversation.update({
      where: { id: conversation.id },
      data: { handoffStatus: HandoffStatus.HUMAN_ACTIVE },
    });

    await db.analyticsEvent.create({
      data: {
        doctorId,
        eventType: "HANDOFF",
        metadata: JSON.stringify({ reason: safety.isEmergency ? "EMERGENCY" : "MEDICAL_DIAGNOSIS" }),
      },
    });
  }

  // 5. Human Handoff Request
  else if (detected.intent === IntentType.HUMAN_HANDOFF || detected.intent === IntentType.COMPLAINT) {
    finalReplyText = (await getTemplateResponse(doctorId, IntentType.HUMAN_HANDOFF)) || "تم تحويل المحادثة للاستقبال.";
    handledBy = "RULE_TEMPLATE";

    await db.conversation.update({
      where: { id: conversation.id },
      data: { handoffStatus: HandoffStatus.HUMAN_ACTIVE },
    });

    await db.analyticsEvent.create({
      data: {
        doctorId,
        eventType: "HANDOFF",
        metadata: JSON.stringify({ reason: detected.intent }),
      },
    });
  }

  // 6. Multi-Intent Detection (e.g., "الكشف كام وبتشتغلوا الجمعة ولا لا؟")
  else if (detected.multiIntents && detected.multiIntents.length > 1) {
    const doctor = await db.doctor.findUnique({ where: { id: doctorId } });
    const isPriceAsked = detected.multiIntents.includes(IntentType.PRICES);
    const isHoursAsked = detected.multiIntents.includes(IntentType.WORKING_HOURS);
    const isBookingAsked = detected.multiIntents.includes(IntentType.BOOK_APPOINTMENT);

    if (isPriceAsked && isHoursAsked) {
      finalReplyText = `أهلاً بحضرتك! سعر الكشف مع د. ${doctor?.name} بـ ${doctor?.consultationPrice} ج.م، ومواعيد العيادة ${doctor?.workingHours}. تحب أساعدك تحجز ميعاد المناسب ليك؟`;
      handledBy = "MULTI_INTENT";
    } else if (isPriceAsked && isBookingAsked) {
      finalReplyText = `أهلاً بك! سعر الكشف بـ ${doctor?.consultationPrice} ج.م. وممكن نحجزلك أقرب ميعاد متاح. اختر الخدمة: 1. كشف جلدية (500 ج.م)`;
      handledBy = "MULTI_INTENT";

      await db.conversation.update({
        where: { id: conversation.id },
        data: { state: ConversationState.SELECT_SERVICE },
      });
    }
  }

  // 7. State Machine Processing (Booking, Rescheduling, Cancelling Flow)
  if (
    !finalReplyText &&
    (conversation.state !== ConversationState.IDLE ||
      detected.intent === IntentType.BOOK_APPOINTMENT ||
      detected.intent === IntentType.RESCHEDULE_APPOINTMENT ||
      detected.intent === IntentType.CANCEL_APPOINTMENT)
  ) {
    const stateResult = await processStateMachine(
      doctorId,
      conversation.id,
      patient.id,
      conversation.state as ConversationState,
      rawText,
      detected.intent
    );

    if (stateResult.isHandled && stateResult.responseMessage) {
      finalReplyText = stateResult.responseMessage;
      handledBy = "STATE_MACHINE";

      await db.analyticsEvent.create({
        data: {
          doctorId,
          eventType: stateResult.appointmentBooked ? "BOOKING_CREATED" : "RULE_HANDLED",
          metadata: JSON.stringify({ state: stateResult.nextState }),
        },
      });
    }
  }

  // 8. Deterministic Intent Templates (Greetings, Hours, Location, Services, Prices)
  if (!finalReplyText) {
    const templateReply = await getTemplateResponse(doctorId, detected.intent);
    if (templateReply) {
      finalReplyText = templateReply;
      handledBy = "RULE_TEMPLATE";

      await db.analyticsEvent.create({
        data: {
          doctorId,
          eventType: "RULE_HANDLED",
          metadata: JSON.stringify({ rule: detected.ruleMatched }),
        },
      });
    }
  }

  // 9. FAQ & Knowledge Base Cache Layer
  if (!finalReplyText) {
    const faqMatch = await matchFaqOrKnowledgeBase(doctorId, rawText);
    if (faqMatch.matched && faqMatch.answer) {
      finalReplyText = faqMatch.answer;
      handledBy = "FAQ_CACHE";

      await db.analyticsEvent.create({
        data: {
          doctorId,
          eventType: "CACHE_HIT",
          metadata: JSON.stringify({ matchType: faqMatch.matchType, title: faqMatch.entryTitle }),
        },
      });
    }
  }

  // 10. LLM Fallback (Used ONLY when all deterministic layers fail!)
  if (!finalReplyText) {
    const llmRes = await queryDoctorLlm({
      doctorId,
      conversationId: conversation.id,
      userMessage: rawText,
      complexity: "LOW",
      reason: "FALLBACK_UNHANDLED_INTENT",
    });

    finalReplyText = llmRes.content;
    handledBy = "LLM";
    aiCost = llmRes.estimatedCost;

    await db.conversation.update({
      where: { id: conversation.id },
      data: { aiCallCount: conversation.aiCallCount + 1 },
    });

    await db.analyticsEvent.create({
      data: {
        doctorId,
        eventType: "AI_HANDLED",
        metadata: JSON.stringify({ model: llmRes.modelUsed, cost: aiCost }),
      },
    });
  }

  // 11. Send Outbound WhatsApp Reply
  await sendWhatsAppTextMessage(patientPhone, finalReplyText);

  await db.message.create({
    data: {
      conversationId: conversation.id,
      sender: "BOT",
      content: finalReplyText,
      wasHandledByAi: handledBy === "LLM" || handledBy === "MULTI_INTENT",
      ruleMatched: handledBy,
      status: "delivered",
    },
  });

  const updatedConv = await db.conversation.findUnique({ where: { id: conversation.id } });

  return {
    replyText: finalReplyText,
    handledBy,
    intent: detected.intent,
    conversationState: (updatedConv?.state || ConversationState.IDLE) as ConversationState,
    handoffStatus: (updatedConv?.handoffStatus || HandoffStatus.AI_ACTIVE) as HandoffStatus,
    aiCost,
  };
}
