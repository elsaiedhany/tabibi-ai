import { IntentType } from "../types";
import { normalizeText } from "./arabic";
import { checkMedicalSafety } from "./medical-safety";

export interface ExtractedEntities {
  specialty?: string | null;
  doctorName?: string | null;
  serviceName?: string | null;
  dateRaw?: string | null;
  dateStr?: string | null; // e.g. YYYY-MM-DD
  timePreference?: string | null; // e.g. "after_18:00", "morning", "evening", "19:00"
  slotNumber?: number | null;
}

export interface StructuredIntentResult {
  intent: IntentType;
  confidence: number;
  ruleMatched: string;
  entities: ExtractedEntities;
  multiIntents: IntentType[];
  needsClarification: boolean;
  clarificationQuestion?: string | null;
}

/**
 * Fast Rule-Based Intent Detector (0 Cost, Sub-millisecond Execution)
 * Handles Medical Emergencies, Handoffs, Confirmations, and Exact Triggers
 */
export function detectIntent(text: string): StructuredIntentResult {
  const norm = normalizeText(text);

  // 0. Safety Emergency Check First
  const safety = checkMedicalSafety(text);
  if (safety.isEmergency) {
    return {
      intent: IntentType.EMERGENCY,
      confidence: 1.0,
      ruleMatched: "EMERGENCY_KEYWORD",
      entities: {},
      multiIntents: [IntentType.EMERGENCY],
      needsClarification: false,
    };
  }
  if (safety.isMedicalDiagnosis) {
    return {
      intent: IntentType.MEDICAL_REQUEST,
      confidence: 0.95,
      ruleMatched: "MEDICAL_DIAGNOSIS_KEYWORD",
      entities: {},
      multiIntents: [IntentType.MEDICAL_REQUEST],
      needsClarification: false,
    };
  }

  // 1. Human Handoff / Escalation / Complaint
  if (
    norm.includes("عايز اكلم حد") ||
    norm.includes("عاوز اكلم حد") ||
    norm.includes("عاوز اكلم حد") ||
    norm.includes("حولني لاستقبال") ||
    norm.includes("بشري") ||
    norm.includes("انسان") ||
    norm.includes("استقبال") ||
    norm.includes("كلم موظف") ||
    norm.includes("عايز موظف") ||
    norm.includes("ممكن موظف")
  ) {
    return {
      intent: IntentType.HUMAN_HANDOFF,
      confidence: 1.0,
      ruleMatched: "HUMAN_HANDOFF_PHRASE",
      entities: {},
      multiIntents: [IntentType.HUMAN_HANDOFF],
      needsClarification: false,
    };
  }

  if (
    norm.includes("اشتكي") ||
    norm.includes("خدمه سيئه") ||
    norm.includes("مشكله") ||
    norm.includes("خدمه وحشه")
  ) {
    return {
      intent: IntentType.COMPLAINT,
      confidence: 0.95,
      ruleMatched: "COMPLAINT_KEYWORD",
      entities: {},
      multiIntents: [IntentType.COMPLAINT],
      needsClarification: false,
    };
  }

  // Detect Multi-Intents (e.g. "الكشف كام وبتشتغلوا الجمعة؟")
  const multiIntents: IntentType[] = [];
  const isAskingPrice = norm.includes("بكام") || norm.includes("سعر") || norm.includes("اسعار") || norm.includes("تكلفه") || norm.includes("الكشف بكام");
  const isAskingHours = norm.includes("مواعيد") || norm.includes("جمعة") || norm.includes("جمعه") || norm.includes("شغالين") || norm.includes("بتفتحوا") || norm.includes("بيشتغل امتى") || norm.includes("موجود امتى") || norm.includes("امتى بيشتغل");
  const isAskingBooking = norm.includes("احجز") || norm.includes("حجز") || norm.includes("عايز ميعاد") || norm.includes("عاوز ميعاد") || norm.includes("كشف جديد");
  const isAskingLocation = norm.includes("فين") || norm.includes("عنوان") || norm.includes("مكان") || norm.includes("خريطة") || norm.includes("ازاي اوصل");

  if (isAskingPrice) multiIntents.push(IntentType.PRICES);
  if (isAskingHours) multiIntents.push(IntentType.WORKING_HOURS);
  if (isAskingBooking) multiIntents.push(IntentType.BOOK_APPOINTMENT);
  if (isAskingLocation) multiIntents.push(IntentType.LOCATION);

  // Extract slot selection numbers (e.g., "1", "2", "الموعد الأول")
  let slotNumber: number | null = null;
  const numMatch = text.match(/\b([1-9])\b/);
  if (numMatch) {
    slotNumber = parseInt(numMatch[1], 10);
  }

  // 2. Cancellation & Rescheduling
  if (
    norm.includes("الغي") ||
    norm.includes("الغاء") ||
    norm.includes("مش هاجي") ||
    norm.includes("الغي ميعادي") ||
    norm.includes("الغيه")
  ) {
    return {
      intent: IntentType.CANCEL_APPOINTMENT,
      confidence: 0.95,
      ruleMatched: "CANCEL_KEYWORD",
      entities: { slotNumber },
      multiIntents: [IntentType.CANCEL_APPOINTMENT],
      needsClarification: false,
    };
  }

  if (
    norm.includes("عدل") ||
    norm.includes("تعديل") ||
    norm.includes("غير ميعاد") ||
    norm.includes("اغير المعاد") ||
    norm.includes("غيرلي المعاد") ||
    norm.includes("غير الميعاد") ||
    norm.includes("تاجيل") ||
    norm.includes("اجل")
  ) {
    return {
      intent: IntentType.RESCHEDULE_APPOINTMENT,
      confidence: 0.95,
      ruleMatched: "RESCHEDULE_KEYWORD",
      entities: { slotNumber },
      multiIntents: [IntentType.RESCHEDULE_APPOINTMENT],
      needsClarification: false,
    };
  }

  // 3. Booking Intent
  if (isAskingBooking || norm.includes("احجز") || norm.includes("عايز كشف") || norm.includes("عاوز كشف")) {
    return {
      intent: IntentType.BOOK_APPOINTMENT,
      confidence: 0.95,
      ruleMatched: "BOOKING_KEYWORD",
      entities: { slotNumber },
      multiIntents: multiIntents.length > 0 ? multiIntents : [IntentType.BOOK_APPOINTMENT],
      needsClarification: false,
    };
  }

  // 4. Confirmations & Rejections (Yes / No)
  if (
    norm === "نعم" ||
    norm === "ايوه" ||
    norm === "تمام" ||
    norm === "ماشي" ||
    norm === "موافق" ||
    norm === "اوكي" ||
    norm === "ok" ||
    norm === "ايوة" ||
    norm === "اكيد"
  ) {
    return {
      intent: IntentType.CONFIRMATION,
      confidence: 0.9,
      ruleMatched: "CONFIRMATION_EXACT",
      entities: {},
      multiIntents: [IntentType.CONFIRMATION],
      needsClarification: false,
    };
  }

  if (
    norm === "لا" ||
    norm === "مش موافق" ||
    norm === "بلاش" ||
    norm === "مش عايز" ||
    norm === "غيرت رايي"
  ) {
    return {
      intent: IntentType.REJECTION,
      confidence: 0.9,
      ruleMatched: "REJECTION_EXACT",
      entities: {},
      multiIntents: [IntentType.REJECTION],
      needsClarification: false,
    };
  }

  // 5. Single Prices / Hours / Location / Services / Doctor Questions
  if (isAskingPrice && multiIntents.length <= 1) {
    return {
      intent: IntentType.PRICES,
      confidence: 0.95,
      ruleMatched: "PRICES_KEYWORD",
      entities: {},
      multiIntents: [IntentType.PRICES],
      needsClarification: false,
    };
  }

  if (
    (norm.includes("مواعيد") ||
    norm.includes("ساعات العمل") ||
    norm.includes("بتفتحوا") ||
    norm.includes("مفتوحين") ||
    norm.includes("شغالين") ||
    norm.includes("موجود") ||
    norm.includes("امتي") ||
    norm.includes("امتى") ||
    norm.includes("بتغلقوا")) && multiIntents.length <= 1
  ) {
    return {
      intent: IntentType.WORKING_HOURS,
      confidence: 0.95,
      ruleMatched: "WORKING_HOURS_KEYWORD",
      entities: {},
      multiIntents: [IntentType.WORKING_HOURS],
      needsClarification: false,
    };
  }

  if (isAskingLocation && multiIntents.length <= 1) {
    return {
      intent: IntentType.LOCATION,
      confidence: 0.95,
      ruleMatched: "LOCATION_KEYWORD",
      entities: {},
      multiIntents: [IntentType.LOCATION],
      needsClarification: false,
    };
  }

  if (norm.includes("خدمات") || norm.includes("عندكم ايه") || norm.includes("بتعملوا ايه") || norm.includes("التخصصات")) {
    return {
      intent: IntentType.SERVICES,
      confidence: 0.9,
      ruleMatched: "SERVICES_KEYWORD",
      entities: {},
      multiIntents: [IntentType.SERVICES],
      needsClarification: false,
    };
  }

  if (norm.includes("دكاترة") || norm.includes("دكتور مين") || norm.includes("مين الاطباء") || norm.includes("اسماء الدكاترة") || norm.includes("مين الدكتور")) {
    return {
      intent: IntentType.DOCTORS,
      confidence: 0.9,
      ruleMatched: "DOCTORS_KEYWORD",
      entities: {},
      multiIntents: [IntentType.DOCTORS],
      needsClarification: false,
    };
  }

  // 6. Greetings
  if (
    norm.includes("السلام عليكم") ||
    norm.includes("اهلا") ||
    norm.includes("ازيك") ||
    norm.includes("صباح الخير") ||
    norm.includes("مساء الخير") ||
    norm.includes("هاي") ||
    norm.includes("مرحبا")
  ) {
    return {
      intent: IntentType.GREETING,
      confidence: 0.95,
      ruleMatched: "GREETING_KEYWORD",
      entities: {},
      multiIntents: [IntentType.GREETING],
      needsClarification: false,
    };
  }

  if (norm.includes("شكرا") || norm.includes("تسلم") || norm.includes("ربنا يخليك") || norm.includes("الف شكر")) {
    return {
      intent: IntentType.THANK_YOU,
      confidence: 0.95,
      ruleMatched: "THANK_YOU_KEYWORD",
      entities: {},
      multiIntents: [IntentType.THANK_YOU],
      needsClarification: false,
    };
  }

  if (norm.includes("مع السلامه") || norm.includes("سلام") || norm.includes("باي")) {
    return {
      intent: IntentType.GOODBYE,
      confidence: 0.95,
      ruleMatched: "GOODBYE_KEYWORD",
      entities: {},
      multiIntents: [IntentType.GOODBYE],
      needsClarification: false,
    };
  }

  // Multi-intent fallback if 2+ intents detected
  if (multiIntents.length > 1) {
    return {
      intent: multiIntents[0],
      confidence: 0.9,
      ruleMatched: "MULTI_INTENT_KEYWORD",
      entities: { slotNumber },
      multiIntents,
      needsClarification: false,
    };
  }

  // Default fallback to UNKNOWN (Triggers FAQ search then LLM Structured Parser)
  return {
    intent: IntentType.UNKNOWN,
    confidence: 0.0,
    ruleMatched: "NONE",
    entities: { slotNumber },
    multiIntents: [],
    needsClarification: false,
  };
}

export function parseEgyptianRelativeDate(text: string): string | null {
  if (!text) return null;
  const norm = normalizeText(text);
  const today = new Date();

  if (norm.includes("النهار ده") || norm.includes("النهاردة") || norm.includes("اليوم")) {
    return today.toISOString().split("T")[0];
  }
  if (norm.includes("بكره") || norm.includes("بكرة") || norm.includes("غدا")) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }
  if (norm.includes("بعد بكره") || norm.includes("بعد بكرة")) {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  }

  const daysMap: Record<string, number> = {
    "الاحد": 0, "الأحد": 0, "احد": 0,
    "الاثنين": 1, "الإثنين": 1, "اتنين": 1,
    "الثلاثاء": 2, "تلات": 2, "الثلاثا": 2,
    "الاربعاء": 3, "الأربعاء": 3, "اربع": 3,
    "الخميس": 4, "خميس": 4,
    "الجمعة": 5, "الجمعه": 5, "جمعة": 5,
    "السبت": 6, "سبت": 6,
  };

  for (const [dayName, dayIndex] of Object.entries(daysMap)) {
    if (norm.includes(dayName)) {
      const currentDay = today.getDay();
      let diff = dayIndex - currentDay;
      if (diff <= 0) diff += 7;
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + diff);
      return targetDate.toISOString().split("T")[0];
    }
  }

  return null;
}
