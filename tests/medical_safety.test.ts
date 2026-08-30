import { describe, it, expect } from "vitest";
import { checkMedicalSafety } from "../src/lib/medical-safety";

describe("Medical Safety & Emergency Symptoms Guardrail", () => {
  it("should trigger emergency advisory for chest pain and shortness of breath", () => {
    const raw = "عندي ألم شديد جداً في صدري ومش قادر أتنفس";
    const res = checkMedicalSafety(raw);
    expect(res.isEmergency).toBe(true);
    expect(res.safetyResponse).toContain("123");
    expect(res.safetyResponse).toContain("طوارئ");
  });

  it("should block diagnosis request and advise receptionist escalation", () => {
    const raw = "عندي حكة شديدة في الجلد، اكتبلي دواء أو روشتة أشتريها من الصيدلية";
    const res = checkMedicalSafety(raw);
    expect(res.isMedicalDiagnosis).toBe(true);
    expect(res.safetyResponse).toContain("لا يمكنني تقديم تشخيص طبي");
  });
});
