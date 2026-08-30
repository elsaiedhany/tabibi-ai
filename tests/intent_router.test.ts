import { describe, it, expect } from "vitest";
import { detectIntent } from "../src/lib/intent";
import { IntentType } from "../src/types/index";

describe("Deterministic Intent Router System", () => {
  it("should classify greetings correctly", () => {
    const res = detectIntent("السلام عليكم ورحمة الله وبركاته");
    expect(res.intent).toBe(IntentType.GREETING);
    expect(res.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("should classify price inquiry", () => {
    const res = detectIntent("هو الكشف بكام وسعر المتابعة كام؟");
    expect(res.intent).toBe(IntentType.PRICES);
  });

  it("should classify working hours inquiry", () => {
    const res = detectIntent("مواعيد العمل عندكم ايه وساعات الفتح؟");
    expect(res.intent).toBe(IntentType.WORKING_HOURS);
  });

  it("should classify location inquiry", () => {
    const res = detectIntent("فين عنوان العيادة وازاي اوصلكم؟");
    expect(res.intent).toBe(IntentType.LOCATION);
  });

  it("should classify booking request", () => {
    const res = detectIntent("عايز احجز ميعاد مع الدكتور أحمد بكرة");
    expect(res.intent).toBe(IntentType.BOOK_APPOINTMENT);
  });

  it("should classify cancellation request", () => {
    const res = detectIntent("عايز الغي الميعاد بتاعي ومش هاجي");
    expect(res.intent).toBe(IntentType.CANCEL_APPOINTMENT);
  });

  it("should classify human handoff request", () => {
    const res = detectIntent("عايز اكلم حد من الاستقبال البشري ضروري");
    expect(res.intent).toBe(IntentType.HUMAN_HANDOFF);
  });
});
