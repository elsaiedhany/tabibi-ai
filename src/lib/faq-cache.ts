import { db } from "./db";
import { normalizeText } from "./arabic";

export interface FaqMatchResult {
  matched: boolean;
  answer: string;
  matchType: "EXACT" | "NORMALIZED" | "FUZZY" | "KB_RETRIEVAL" | "NONE";
  entryTitle?: string;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export async function matchFaqOrKnowledgeBase(
  doctorId: string,
  rawQuestion: string
): Promise<FaqMatchResult> {
  const normQ = normalizeText(rawQuestion);
  if (!normQ) return { matched: false, answer: "", matchType: "NONE" };

  const faqs = await db.faqEntry.findMany({
    where: { doctorId },
  });

  const exactFaq = faqs.find((f) => f.normalizedQ === normQ || f.question.trim() === rawQuestion.trim());
  if (exactFaq) {
    await db.faqEntry.update({
      where: { id: exactFaq.id },
      data: { hitCount: exactFaq.hitCount + 1 },
    });
    return {
      matched: true,
      answer: exactFaq.answer,
      matchType: "EXACT",
      entryTitle: exactFaq.question,
    };
  }

  const partialFaq = faqs.find((f) => normQ.includes(f.normalizedQ) || f.normalizedQ.includes(normQ));
  if (partialFaq) {
    await db.faqEntry.update({
      where: { id: partialFaq.id },
      data: { hitCount: partialFaq.hitCount + 1 },
    });
    return {
      matched: true,
      answer: partialFaq.answer,
      matchType: "NORMALIZED",
      entryTitle: partialFaq.question,
    };
  }

  for (const faq of faqs) {
    const dist = levenshteinDistance(normQ, faq.normalizedQ);
    const maxLen = Math.max(normQ.length, faq.normalizedQ.length);
    const similarity = 1 - dist / maxLen;
    if (similarity > 0.72) {
      await db.faqEntry.update({
        where: { id: faq.id },
        data: { hitCount: faq.hitCount + 1 },
      });
      return {
        matched: true,
        answer: faq.answer,
        matchType: "FUZZY",
        entryTitle: faq.question,
      };
    }
  }

  const kbEntries = await db.knowledgeBase.findMany({
    where: { doctorId },
  });

  for (const kb of kbEntries) {
    const normTitle = normalizeText(kb.title);
    const normContent = normalizeText(kb.content);
    const normTags = kb.tags ? normalizeText(kb.tags) : "";

    if (normQ.includes(normTitle) || normTitle.includes(normQ) || (normTags && normTags.includes(normQ))) {
      return {
        matched: true,
        answer: `${kb.title}:\n${kb.content}`,
        matchType: "KB_RETRIEVAL",
        entryTitle: kb.title,
      };
    }
  }

  return { matched: false, answer: "", matchType: "NONE" };
}
