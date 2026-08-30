/**
 * Arabic & Egyptian Dialect Text Normalizer
 * Designed specifically for Egyptian medical clinic receptionist interaction.
 */

export function removeTashkeel(text: string): string {
  // Remove Arabic diacritics / tashkeel (Fatha, Damma, Kasra, Sukun, Shadda, Tanwin, etc.)
  return text.replace(/[\u064B-\u0652\u0670]/g, "");
}

export function normalizeArabicLetters(text: string): string {
  let res = removeTashkeel(text);

  // Normalize Alef variations
  res = res.replace(/[أإآٱ]/g, "ا");

  // Normalize Ya & Alif Maqsura
  res = res.replace(/ى/g, "ي");

  // Normalize Ta Marbouta to Ha (or vice versa for consistent comparison)
  res = res.replace(/ة/g, "ه");

  // Remove repeated characters (e.g. "أهلاًأأأ" or "حجزززز" -> "حجز")
  res = res.replace(/(.)\1{2,}/g, "$1");

  // Normalize punctuation and symbols
  res = res.replace(/[?؟!.,:-_\/\\]/g, " ");

  // Normalize whitespace
  res = res.replace(/\s+/g, " ").trim();

  return res.toLowerCase();
}

/**
 * Arabizi to Standard Normalized Arabic Mapping
 */
const ARABIZI_MAP: Record<string, string> = {
  "3ayez": "عايز",
  "3ayza": "عاوزه",
  "3ayzeen": "عايزين",
  "a7gez": "احجز",
  "a7gezli": "احجزلي",
  "agez": "احجز",
  "kashf": "كشف",
  "el kashf": "الكشف",
  "be kam": "بكام",
  "bekam": "بكام",
  "3eyada": "عيادة",
  "3iada": "عيادة",
  "mowa3eed": "مواعيد",
  "mwa3ed": "مواعيد",
  "fin": "فين",
  "feen": "فين",
  "doktor": "دكتور",
  "dr": "دكتور",
  "momken": "ممكن",
  "el3enwan": "العنوان",
  "enwan": "عنوان",
  "elgelsa": "الجلسة",
  "shokran": "شكرا",
  "thx": "شكرا",
  "thanks": "شكرا",
  "hi": "اهلا",
  "hello": "اهلا",
  "cancel": "الغي",
  "elghi": "الغي",
  "3adel": "عدل",
};

export function convertArabiziToArabic(text: string): string {
  let normalized = text.toLowerCase().trim();
  for (const [arabizi, arabic] of Object.entries(ARABIZI_MAP)) {
    const regex = new RegExp(`\\b${arabizi}\\b`, "gi");
    normalized = normalized.replace(regex, arabic);
  }
  return normalized;
}

export function normalizeText(text: string): string {
  if (!text) return "";
  const arabiziConverted = convertArabiziToArabic(text);
  return normalizeArabicLetters(arabiziConverted);
}
