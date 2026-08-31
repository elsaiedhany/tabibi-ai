import { AIProvider, AICompletionRequest, AICompletionResponse } from "./provider";

export class OpenAIProvider implements AIProvider {
  name = "OpenAI";
  private defaultModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

  async generateResponse(request: AICompletionRequest): Promise<AICompletionResponse> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey.includes("sk-mock") || apiKey === "sk-mock-key") {
      // Warm Egyptian Arabic Mock Reply for Local Development & Testing
      const isPrice = request.userMessage.includes("بكام") || request.userMessage.includes("سعر");
      const isHours = request.userMessage.includes("مواعيد") || request.userMessage.includes("جمعة") || request.userMessage.includes("امتى");

      let mockReply = "";
      if (isPrice && isHours) {
        mockReply = `أهلاً بحضرتك! سعر الكشف مع د. ${request.doctorName} بـ ${request.consultationPrice || 500} ج.م، ومواعيد العيادة ${request.workingHours}. تحب أساعدك تحجز ميعاد المناسب ليك؟`;
      } else if (isPrice) {
        mockReply = `أهلاً بحضرتك! سعر الكشف مع د. ${request.doctorName} (${request.specialty}) هو ${request.consultationPrice || 500} ج.م والمتابعة خلال 14 يوم بـ ${request.followupPrice || 300} ج.م. تحب أسجلك حجز كشف؟`;
      } else if (isHours) {
        mockReply = `أهلاً بحضرتك! مواعيد د. ${request.doctorName} هي ${request.workingHours}. تحب تحجز ميعاد بكرة أو يوم تاني؟`;
      } else {
        mockReply = `أهلاً بك! بالنسبة لاستفسارك عن "${request.userMessage}"، يسعدني إفادتك بأن د. ${request.doctorName} يتشرف بزيارتك. سعر الكشف ${request.consultationPrice || 500} ج.م ومواعيده ${request.workingHours}. تحب أساعدك تحجز ميعاد؟`;
      }

      return {
        replyText: mockReply,
        detectedIntent: "GENERAL_INQUIRY",
        suggestedAction: { actionType: "NONE" },
        inputTokens: 120,
        outputTokens: 45,
        estimatedCostUsd: 0.00005,
        providerName: this.name,
        modelName: "mock-development-provider",
      };
    }

    const assistantName = request.aiName || "مريم";
    const servicesStr = request.services.map((s) => `- ${s.name}: ${s.price} ج.م (${s.durationMinutes} دقيقة)`).join("\n");
    const locationsStr = request.locations.map((l) => `- ${l.name}: ${l.address}`).join("\n");

    const systemPrompt = request.systemPromptOverride || `أنت ${assistantName}، المساعدة الذكية الرسمية لعيادة ${request.doctorName} (تخصص ${request.specialty}).
تحدث باللهجة المصرية الودودة والاحترافية.

معلومات العيادة:
- المواعيد: ${request.workingHours}
- كشف أول مرة: ${request.consultationPrice || 500} ج.م
- استشارة إعادة: ${request.followupPrice || 300} ج.م
- الفروع:
${locationsStr || "الفرع الرئيسي"}
- الخدمات والأسعار:
${servicesStr || "كشف وطب عام"}

قواعد الخدمة:
1. أجب عن استفسارات المرضى بود ودقة وبموجز مفيد.
2. لا تقدم تشخيصات طبية معقدة أو توصف أدوية نهائياً.
3. إذا طلب المريض حجز موعد، اعرض عليه المواعيد المتاحة واطلب تحديد الاسم والخدمة.
4. إذا أبدى المريض انزعاجاً أو طلب التحدث مع سكرتير العيادة، وجه له التحية وأخبره بتحويل المحادثة.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...request.conversationHistory,
      { role: "user", content: request.userMessage },
    ];

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages,
          temperature: 0.5,
          max_tokens: 400,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const choice = data.choices?.[0]?.message?.content || "";
      const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };

      const inputCost = (usage.prompt_tokens / 1_000_000) * 0.15;
      const outputCost = (usage.completion_tokens / 1_000_000) * 0.60;
      const totalCostUsd = inputCost + outputCost;

      return {
        replyText: choice.trim(),
        detectedIntent: "GENERAL_INQUIRY",
        suggestedAction: { actionType: "NONE" },
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        estimatedCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
        providerName: this.name,
        modelName: this.defaultModel,
      };
    } catch (err: any) {
      console.warn("⚠️ OpenAI Provider API Call Warning:", err?.message || err);

      const isPrice = request.userMessage.includes("بكام") || request.userMessage.includes("سعر");
      const isHours = request.userMessage.includes("مواعيد") || request.userMessage.includes("جمعة") || request.userMessage.includes("امتى");

      let fallbackReply = `أهلاً بك! بالنسبة لاستفسارك عن "${request.userMessage}"، يسعدنا مساعدتك في عيادة د. ${request.doctorName}. سعر الكشف ${request.consultationPrice || 500} ج.م ومواعيده ${request.workingHours}. تحب أساعدك تحجز ميعاد؟`;

      if (isPrice && isHours) {
        fallbackReply = `أهلاً بحضرتك! سعر الكشف مع د. ${request.doctorName} بـ ${request.consultationPrice || 500} ج.م، ومواعيد العيادة ${request.workingHours}. تحب أساعدك تحجز ميعاد المناسب ليك؟`;
      } else if (isPrice) {
        fallbackReply = `أهلاً بحضرتك! سعر الكشف مع د. ${request.doctorName} (${request.specialty}) هو ${request.consultationPrice || 500} ج.م والمتابعة خلال 14 يوم بـ ${request.followupPrice || 300} ج.م. تحب أسجلك حجز كشف؟`;
      } else if (isHours) {
        fallbackReply = `أهلاً بحضرتك! مواعيد د. ${request.doctorName} هي ${request.workingHours}. تحب تحجز ميعاد بكرة أو يوم تاني؟`;
      }

      return {
        replyText: fallbackReply,
        detectedIntent: "GENERAL_INQUIRY",
        suggestedAction: { actionType: "NONE" },
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
        providerName: this.name,
        modelName: "fallback-on-error",
      };
    }
  }
}

let activeProvider: AIProvider = new OpenAIProvider();

export function getAIProvider(): AIProvider {
  return activeProvider;
}

export function setAIProvider(provider: AIProvider): void {
  activeProvider = provider;
}
