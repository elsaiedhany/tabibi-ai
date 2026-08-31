import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "../src/lib/db";
import { generateN8nSignature, dispatchToN8nOrchestrator } from "../src/lib/n8n";
import { OpenAIProvider } from "../src/lib/ai/openai-provider";

describe("🏥 Dynamic Multi-Tenant n8n & AI Provider Integration", () => {
  const testDoctorEmail = `n8n_test_doc_${Date.now()}@tabibi.ai`;
  let doctorId: string;

  beforeEach(async () => {
    const doc = await db.doctor.create({
      data: {
        name: "د. أيمن العوضي",
        title: "استشاري الباطنة والقلب",
        specialty: "باطنة",
        whatsappNumber: `201${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: testDoctorEmail,
        workingHours: "السبت إلى الأربعاء: 5 م - 11 م",
        consultationPrice: 600,
        settings: {
          create: {
            isAiEnabled: true,
            n8nEnabled: true,
            integrationStatus: "READY",
            customSystemPrompt: "أنت المساعد الافتراضي لدكتور أيمن العوضي.",
          },
        },
      },
      include: { settings: true },
    });

    doctorId = doc.id;
  });

  afterEach(async () => {
    try {
      await db.doctorSettings.deleteMany({ where: { doctorId } });
      await db.doctor.deleteMany({ where: { id: doctorId } });
    } catch (_) {}
  });

  it("1. Initializes per-clinic integration settings correctly in DB", async () => {
    const settings = await db.doctorSettings.findUnique({ where: { doctorId } });
    expect(settings).not.toBeNull();
    expect(settings?.isAiEnabled).toBe(true);
    expect(settings?.n8nEnabled).toBe(true);
    expect(settings?.integrationStatus).toBe("READY");
    expect(settings?.customSystemPrompt).toContain("أيمن العوضي");
  });

  it("2. Generates cryptographic HMAC SHA-256 signatures for backend -> n8n calls", () => {
    const rawBody = JSON.stringify({ eventId: "evt_123", clinicId: "clinic_456" });
    const timestamp = "1788192000000";
    const sig = generateN8nSignature(rawBody, timestamp);

    expect(sig).toBeDefined();
    expect(typeof sig).toBe("string");
    expect(sig.length).toBe(64); // SHA-256 hex string length
  });

  it("3. OpenAI AI Provider returns structured response with token and cost metrics", async () => {
    const provider = new OpenAIProvider();
    const res = await provider.generateResponse({
      doctorId,
      doctorName: "د. أيمن العوضي",
      specialty: "باطنة",
      workingHours: "5 م - 11 م",
      consultationPrice: 600,
      services: [{ name: "كشف باطنة", price: 600, durationMinutes: 30 }],
      locations: [{ name: "فرع الدقي", address: "شارع مصدق" }],
      conversationHistory: [],
      userMessage: "مواعيد الكشف بكام؟",
    });

    expect(res).toBeDefined();
    expect(res.replyText).toBeDefined();
    expect(res.providerName).toBe("OpenAI");
    expect(res.estimatedCostUsd).toBeGreaterThanOrEqual(0);
  });

  it("4. Gracefully falls back to backend AI when n8n is unreachable", async () => {
    const res = await dispatchToN8nOrchestrator({
      eventId: "evt_test",
      clinicId: doctorId,
      doctorId,
      doctorName: "د. أيمن العوضي",
      conversationId: "conv_123",
      patientId: "pat_123",
      patientPhone: "201000",
      whatsappMessageId: "wamid_123",
      messageText: "عاوز احجز ميعاد",
      tenantConfiguration: {
        n8nWebhookUrl: "https://invalid-n8n-domain-test-99.com/webhook",
        isAiEnabled: true,
        n8nEnabled: true,
        integrationStatus: "READY",
        workingHours: "5 م - 11 م",
        services: [],
      },
      timestamp: new Date().toISOString(),
    });

    expect(res.success).toBe(false);
    expect(res.handledBy).toBe("BACKEND_FALLBACK");
  });
});
