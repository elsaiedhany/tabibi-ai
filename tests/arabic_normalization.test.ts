import { describe, it, expect } from "vitest";
import { normalizeArabicLetters, convertArabiziToArabic, normalizeText } from "../src/lib/arabic";

describe("Arabic Text Normalization & Dialect Engine", () => {
  it("should remove diacritics / tashkeel and normalize Alef & Ya", () => {
    const raw = "أَهْلاً بِحَضْرَتِكَ فِـي عِيَادَةِ دُكْتُورْ أحمد";
    const normalized = normalizeText(raw);
    expect(normalized).toContain("اهلا");
    expect(normalized).toContain("بحضرتك");
    expect(normalized).toContain("احمد");
  });

  it("should normalize common Egyptian dialect booking variations", () => {
    const phrases = ["عايز احجز", "عاوزه احجز", "ممكن حجز", "احجزلي", "عايز ميعاد"];
    phrases.forEach((phrase) => {
      const norm = normalizeText(phrase);
      expect(norm).toMatch(/(احجز|حجز|ميعاد)/);
    });
  });

  it("should convert Franco / Arabizi to Egyptian Arabic", () => {
    const arabiziInput = "3ayez a7gez kashf 3eyada doctor ahmed";
    const converted = convertArabiziToArabic(arabiziInput);
    expect(converted).toContain("عايز");
    expect(converted).toContain("احجز");
    expect(converted).toContain("كشف");
    expect(converted).toContain("عيادة");
  });
});
