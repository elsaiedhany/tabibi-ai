import { normalizeText } from "./arabic";

const EMERGENCY_PATTERNS = [
  /(الم|وجع|الم شديد).*صدر/,
  /ضيق.*تنفس/,
  /مش عارف اتنفس/,
  /نزيف/,
  /غمي عليا/,
  /اغماء/,
  /غيبوبه/,
  /سكته/,
  /جلطه/,
  /حادثه/,
  /مغوص شديد/,
  /تسمم/,
  /chest pain/,
  /bleeding/,
  /shortness of breath/,
  /emergency/,
  /heart attack/,
  /unconscious/,
];

const MEDICAL_DIAGNOSIS_KEYWORDS = [
  "عندي اعراض", "تشخيص", "ايه العلاج", "اخد دواء", "اخد علاج",
  "اعمل ايه لو عندي", "حاسس بـ", "مرضي ايه", "اكتبلي دواء", "روشتة",
  "symptoms", "treatment", "medicine", "diagnosis"
];

export interface MedicalSafetyCheck {
  isEmergency: boolean;
  isMedicalDiagnosis: boolean;
  safetyResponse?: string;
}

export function checkMedicalSafety(rawText: string): MedicalSafetyCheck {
  const norm = normalizeText(rawText);

  // 1. Emergency Check
  const hasEmergency = EMERGENCY_PATTERNS.some((pattern) => pattern.test(norm) || norm.includes("طوارئ"));
  if (hasEmergency) {
    return {
      isEmergency: true,
      isMedicalDiagnosis: false,
      safetyResponse:
        "⚠️ تنبيه مهم جداً: لو بتعاني من طوارئ طبية (مثل ألم شديد بالصدر أو صعوبة بالغة في التنفس)، يرجى التوجه فوراً لـ أقرب مستشفى أو الاتصال بالإسعاف (123).\n\nتم تحويل المحادثة فوراً لـ فريق الاستقبال بالعيادة للمتابعة العاجلة معك.",
    };
  }

  // 2. Medical Diagnosis / Prescription Request Check
  const hasMedical = MEDICAL_DIAGNOSIS_KEYWORDS.some((kw) => norm.includes(kw));
  if (hasMedical) {
    return {
      isEmergency: false,
      isMedicalDiagnosis: true,
      safetyResponse:
        "أنا المساعد الذكي للاستقبال بالعيادة لحجز المواعيد والإجابة على الاستفسارات الإدارية، ولا يمكنني تقديم تشخيص طبي أو وصف أدوية.\n\nتم تحويل المحادثة لفريق الاستقبال لتوجيهك للطبيب المختص.",
    };
  }

  return { isEmergency: false, isMedicalDiagnosis: false };
}
