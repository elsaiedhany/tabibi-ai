import OpenAI from "openai";
import { db } from "./db";
import { IntentType } from "../types/index";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-mock-key",
});

const MODEL_LOW = process.env.OPENAI_MODEL_LOW || "gpt-4o-mini";
const MODEL_HIGH = process.env.OPENAI_MODEL_HIGH || "gpt-4o";

export interface LlmCallConfig {
  doctorId: string;
  conversationId?: string;
  userMessage: string;
  complexity: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
}

export interface LlmResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  modelUsed: string;
  isFallback: boolean;
}

export interface LlmStructuredIntentOutput {
  intent: IntentType;
  confidence: number;
  entities: {
    specialty?: string | null;
    doctorName?: string | null;
    serviceName?: string | null;
    dateRaw?: string | null; // e.g. "بكرة", "الخميس"
    timePreference?: string | null; // e.g. "بعد 6", "بعد العصر"
    slotNumber?: number | null;
  };
  multiIntents: IntentType[];
  needsClarification: boolean;
  clarificationQuestion?: string | null;
}

function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  if (model.includes("gpt-4o-mini")) {
    return (inputTokens * 0.15 + outputTokens * 0.6) / 1000000;
  }
  return (inputTokens * 2.5 + outputTokens * 10.0) / 1000000;
}

export async function isDoctorAiBudgetExceeded(doctorId: string): Promise<boolean> {
  const doctor = await db.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const usageToday = await db.aiUsage.aggregate({
    where: {
      doctorId,
      timestamp: { gte: today },
    },
    _sum: { estimatedCost: true },
    _count: { id: true },
  });

  const totalCostToday = usageToday._sum.estimatedCost || 0;
  const totalCallsToday = usageToday._count.id || 0;

  return totalCostToday >= doctor.maxDailyAiBudget || totalCallsToday >= doctor.maxAiCallsPerDay;
}

/**
 * Uses LLM to parse complex, multi-intent, or paraphrased Egyptian Arabic inputs into structured JSON.
 */
export async function parseLlmStructuredIntent(
  userMessage: string,
  history: Array<{ sender: string; content: string }> = []
): Promise<LlmStructuredIntentOutput> {
  const isMock = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("mock");

  if (isMock) {
    // Intelligent heuristic mock fallback when running without real OpenAI key
    const msg = userMessage.toLowerCase();
    const multiIntents: IntentType[] = [];

    if (msg.includes("بكام") || msg.includes("سعر") || msg.includes("اسعار")) multiIntents.push(IntentType.PRICES);
    if (msg.includes("مواعيد") || msg.includes("الجمعة") || msg.includes("جمعه") || msg.includes("شغالين")) multiIntents.push(IntentType.WORKING_HOURS);
    if (msg.includes("احجز") || msg.includes("حجز") || msg.includes("عايز ميعاد")) multiIntents.push(IntentType.BOOK_APPOINTMENT);

    let intent = IntentType.UNKNOWN;
    if (multiIntents.length > 0) intent = multiIntents[0];
    else if (msg.includes("الغي") || msg.includes("الغاء")) intent = IntentType.CANCEL_APPOINTMENT;
    else if (msg.includes("غير") || msg.includes("تعديل") || msg.includes("تغيير")) intent = IntentType.RESCHEDULE_APPOINTMENT;

    let slotNumber: number | null = null;
    const numMatch = userMessage.match(/\b([1-9])\b/);
    if (numMatch) slotNumber = parseInt(numMatch[1], 10);

    return {
      intent,
      confidence: 0.9,
      entities: {
        dateRaw: msg.includes("بكره") || msg.includes("بكرة") ? "بكرة" : msg.includes("الخميس") ? "الخميس" : null,
        timePreference: msg.includes("بعد 6") ? "بعد 18:00" : msg.includes("بعد العصر") ? "بعد 15:30" : null,
        slotNumber,
      },
      multiIntents: multiIntents.length > 0 ? multiIntents : [intent],
      needsClarification: false,
    };
  }

  const systemPrompt = `You are an expert NLP parser for an Egyptian medical receptionist AI.
Parse the user's message and recent chat history into strict JSON matching this schema:
{
  "intent": "BOOK_APPOINTMENT" | "PRICES" | "WORKING_HOURS" | "LOCATION" | "SERVICES" | "DOCTOR_INFO" | "RESCHEDULE_APPOINTMENT" | "CANCEL_APPOINTMENT" | "GREETING" | "HUMAN_HANDOFF" | "EMERGENCY" | "UNKNOWN",
  "confidence": 0.95,
  "entities": {
    "specialty": string | null,
    "doctorName": string | null,
    "serviceName": string | null,
    "dateRaw": string | null,
    "timePreference": string | null,
    "slotNumber": number | null
  },
  "multiIntents": string[],
  "needsClarification": boolean,
  "clarificationQuestion": string | null
}
Never output markdown backticks or extra prose. Return valid JSON only.`;

  try {
    const historyText = history.map((m) => `${m.sender}: ${m.content}`).join("\n");
    const completion = await openai.chat.completions.create({
      model: MODEL_LOW,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Dialogue History:\n${historyText}\n\nCurrent User Input: "${userMessage}"` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const rawJson = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(rawJson);

    return {
      intent: (parsed.intent as IntentType) || IntentType.UNKNOWN,
      confidence: parsed.confidence || 0.85,
      entities: parsed.entities || {},
      multiIntents: parsed.multiIntents || [parsed.intent || IntentType.UNKNOWN],
      needsClarification: parsed.needsClarification || false,
      clarificationQuestion: parsed.clarificationQuestion || null,
    };
  } catch (err) {
    return {
      intent: IntentType.UNKNOWN,
      confidence: 0.5,
      entities: {},
      multiIntents: [],
      needsClarification: false,
    };
  }
}

/**
 * Main LLM Query function: Combines Dynamic Doctor Prompt, Database Facts, and Dialogue History to produce a warm, natural Egyptian Arabic response.
 */
export async function queryDoctorLlm(config: LlmCallConfig): Promise<LlmResponse> {
  const { doctorId, conversationId, userMessage, complexity, reason } = config;

  const budgetExceeded = await isDoctorAiBudgetExceeded(doctorId);
  if (budgetExceeded) {
    return {
      content: "أهلاً بك! سيقوم مساعد الاستقبال بالرد عليك فوراً لمساعدتك. شكرًا لانتظارك.",
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      modelUsed: "BUDGET_FALLBACK",
      isFallback: true,
    };
  }

  const doctor = await db.doctor.findUnique({
    where: { id: doctorId },
    include: { services: true, locations: true, faqs: { take: 5 } },
  });

  const messagesHistory = conversationId
    ? await db.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "desc" },
        take: 6,
      })
    : [];

  const historyFormatted = messagesHistory
    .reverse()
    .map((m) => `${m.sender === "PATIENT" ? "المريض" : "المساعد"}: ${m.content}`)
    .join("\n");

  const locationsStr = doctor?.locations.map((l) => `${l.name}: ${l.address}`).join(" | ") || "العيادة الرئيسية";
  const servicesStr = doctor?.services.map((s) => `${s.name}: ${s.price} ج.م`).join(", ") || "كشف رئيسي";
  const faqsStr = doctor?.faqs.map((f) => `س: ${f.question} -> ج: ${f.answer}`).join("\n") || "";

  const systemPrompt = `أنت "${doctor?.aiName || "مريم"}"، مساعدة استقبال بشرية ذكية ولطيفة خاصة بعيادة ${doctor?.name || "الدكتور"} (${doctor?.specialty}).

🎯 أسلوب الشخصية (Egyptian Receptionist Persona):
1. الرد باللهجة المصرية الطبيعية الدافئة، بأسلوب محترم وقصير ومناسب للواتساب.
2. عدم كتابة قوائم طولية جافة إلا إذا كانت ضرورية جداً.
3. الإجابة بدقة عن أي أسئلة بناءً على البيانات المعتمدة أدناه.
4. يمنع منعاً باتاً اختراع أسعار أو مواعيد أو عناوين غير موجودة في البيانات المعتمدة.
5. يمنع تقديم تشخيص طبي أو وصف أدوية.
6. إذا سال المريض أكثر من سؤال، أجيبي عن الأسئلة بلباقة في رد واحد منظم.
7. اسألي سؤالاً واحداً واضحاً ومباشراً لتسهيل خطوة الحجز.

📋 بيانات العيادة المعتمدة:
- اسم الطبيب: ${doctor?.name} (${doctor?.title})
- التخصص: ${doctor?.specialty}
- سعر الكشف: ${doctor?.consultationPrice} ج.م
- سعر المتابعة: ${doctor?.followupPrice} ج.م
- مواعيد العمل: ${doctor?.workingHours}
- الفروع والعناوين: ${locationsStr}
- الخدمات والأسعار: ${servicesStr}
- الأسئلة الشائعة:
${faqsStr}`;

  const selectedModel = complexity === "HIGH" ? MODEL_HIGH : MODEL_LOW;

  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("mock")) {
      // Warm Egyptian Arabic Mock Reply for Local Development
      const isPrice = userMessage.includes("بكام") || userMessage.includes("سعر");
      const isHours = userMessage.includes("مواعيد") || userMessage.includes("جمعة") || userMessage.includes("امتى");

      let mockReply = "";
      if (isPrice && isHours) {
        mockReply = `أهلاً بحضرتك! سعر الكشف مع د. ${doctor?.name} بـ ${doctor?.consultationPrice} ج.م، ومواعيد العيادة ${doctor?.workingHours}. تحب أساعدك تحجز ميعاد المناسب ليك؟`;
      } else if (isPrice) {
        mockReply = `أهلاً بحضرتك! سعر الكشف مع د. ${doctor?.name} (${doctor?.specialty}) هو ${doctor?.consultationPrice} ج.م والمتابعة خلال 14 يوم بـ ${doctor?.followupPrice} ج.م. تحب أسجلك حجز كشف؟`;
      } else if (isHours) {
        mockReply = `أهلاً بحضرتك! مواعيد د. ${doctor?.name} هي ${doctor?.workingHours}. العيادة في ${locationsStr}. تحب تحجز ميعاد بكرة أو يوم تاني؟`;
      } else {
        mockReply = `أهلاً بك! بالنسبة لاستفسارك عن "${userMessage}"، يسعدني إفادتك بأن د. ${doctor?.name} يتشرف بزيارتك. سعر الكشف ${doctor?.consultationPrice} ج.م ومواعيده ${doctor?.workingHours}. تحب أساعدك تحجز ميعاد؟`;
      }

      const inputTokens = 150;
      const outputTokens = 50;
      const cost = calculateCost(selectedModel, inputTokens, outputTokens);

      if (conversationId) {
        await db.aiUsage.create({
          data: {
            doctorId,
            conversationId,
            model: selectedModel,
            inputTokens,
            outputTokens,
            estimatedCost: cost,
            reasonForCall: reason,
            complexity,
          },
        });
      }

      return {
        content: mockReply,
        inputTokens,
        outputTokens,
        estimatedCost: cost,
        modelUsed: selectedModel,
        isFallback: false,
      };
    }

    const completion = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `المحادثة السابقة:\n${historyFormatted}\n\nرسالة المريض الحالية:\n${userMessage}` },
      ],
      max_tokens: 220,
      temperature: 0.3,
    });

    const replyText = completion.choices[0]?.message?.content || "أهلاً بحضرتك! هحولك لمساعد الاستقبال فوراً لمساعدتك.";
    const inTokens = completion.usage?.prompt_tokens || 120;
    const outTokens = completion.usage?.completion_tokens || 45;
    const cost = calculateCost(selectedModel, inTokens, outTokens);

    if (conversationId) {
      await db.aiUsage.create({
        data: {
          doctorId,
          conversationId,
          model: selectedModel,
          inputTokens: inTokens,
          outputTokens: outTokens,
          estimatedCost: cost,
          reasonForCall: reason,
          complexity,
        },
      });
    }

    return {
      content: replyText,
      inputTokens: inTokens,
      outputTokens: outTokens,
      estimatedCost: cost,
      modelUsed: selectedModel,
      isFallback: false,
    };
  } catch (error) {
    return {
      content: "أهلاً بحضرتك، حصل ضغط بسيط على السيرفر. هحول المحادثة فوراً لمساعد الاستقبال لمتابعتك.",
      inputTokens: 0,
      outputTokens: 0,
      estimatedCost: 0,
      modelUsed: "ERROR_FALLBACK",
      isFallback: true,
    };
  }
}
