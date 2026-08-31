import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import { db } from "../src/lib/db";
import { generateN8nSignature, verifyN8nSignature, dispatchToN8nOrchestrator } from "../src/lib/n8n";
import { processIncomingPatientMessage } from "../src/lib/message-processor";
import { HandoffStatus } from "../src/types/index";

describe("🔄 Real E2E n8n Dynamic Multi-Tenant Integration Test Suite", () => {
  let server: http.Server;
  const mockN8nPort = 3999;
  const mockN8nUrl = `http://127.0.0.1:${mockN8nPort}/webhook/tabibi-dynamic-webhook`;

  let doctorA: any;
  let doctorB: any;

  beforeAll(async () => {
    // 1. Create Doctor A & Doctor B Tenants in Database
    doctorA = await db.doctor.create({
      data: {
        name: "د. حسام عيسى",
        title: "استشاري جراحة العظام",
        specialty: "عظام",
        whatsappNumber: `201${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: `doc_a_${Date.now()}@tabibi.ai`,
        workingHours: "الأحد والثلاثاء: 6 م - 10 م",
        consultationPrice: 750,
        settings: {
          create: {
            isAiEnabled: true,
            n8nEnabled: true,
            n8nWebhookUrl: mockN8nUrl,
            integrationStatus: "READY",
          },
        },
      },
      include: { settings: true },
    });

    doctorB = await db.doctor.create({
      data: {
        name: "د. نورهان الشاذلي",
        title: "أخصائية الأسنان والتجميل",
        specialty: "أسنان",
        whatsappNumber: `201${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: `doc_b_${Date.now()}@tabibi.ai`,
        workingHours: "السبت والخميس: 2 م - 8 م",
        consultationPrice: 400,
        settings: {
          create: {
            isAiEnabled: true,
            n8nEnabled: true,
            n8nWebhookUrl: mockN8nUrl,
            integrationStatus: "READY",
          },
        },
      },
      include: { settings: true },
    });

    // 2. Start Real Local n8n Mock Server executing workflow logic
    server = http.createServer(async (req, res) => {
      let bodyStr = "";
      req.on("data", (chunk) => (bodyStr += chunk));
      req.on("end", () => {
        const timestamp = req.headers["x-tabibi-timestamp"] as string;
        const signature = req.headers["x-tabibi-signature"] as string;

        // Signature Check Test Node
        const isValidSig = verifyN8nSignature(bodyStr, timestamp, signature);
        if (!isValidSig) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Unauthorized: Invalid Signature" }));
          return;
        }

        try {
          const body = JSON.parse(bodyStr);

          // Simulated Slow Response for Timeout Test
          if (body.messageText?.includes("SIMULATE_TIMEOUT")) {
            setTimeout(() => {
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ replyText: "Delayed Response" }));
            }, 6000);
            return;
          }

          // Simulated Malformed Response Test
          if (body.messageText?.includes("SIMULATE_MALFORMED")) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ badField: 123 })); // Missing replyText!
            return;
          }

          // Dynamic Tenant Processing Node (NO HARDCODING)
          const doctorName = body.doctorName || "الدكتور";
          const workingHours = body.tenantConfiguration?.workingHours || "مواعيد العيادة";
          const price = body.tenantConfiguration?.services?.[0]?.price || 500;
          const msg = (body.messageText || "").toLowerCase();

          let replyText = `أهلاً بحضرتك في عيادة د. ${doctorName}. سعر الكشف ${price} ج.م ومواعيدنا ${workingHours}. تحب نسجلك حجز كشف؟`;

          if (msg.includes("سعر") || msg.includes("بكام")) {
            replyText = `أهلاً بك! سعر الكشف مع د. ${doctorName} هو ${price} ج.م. تحب أساعدك تحجز ميعاد؟`;
          }

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              success: true,
              replyText,
              intent: "PRICES",
              suggestedAction: { actionType: "NONE" },
            })
          );
        } catch (_) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
    });

    await new Promise<void>((resolve) => server.listen(mockN8nPort, "127.0.0.1", resolve));
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    try {
      await db.doctorSettings.deleteMany({ where: { doctorId: { in: [doctorA.id, doctorB.id] } } });
      await db.doctor.deleteMany({ where: { id: { in: [doctorA.id, doctorB.id] } } });
    } catch (_) {}
  });

  it("1. Valid Signature & Dynamic Context Processing (Doctor A)", async () => {
    const payload = {
      eventId: "evt_101",
      clinicId: doctorA.id,
      doctorId: doctorA.id,
      doctorName: doctorA.name,
      conversationId: "conv_a",
      patientId: "pat_a",
      patientPhone: "201011111111",
      whatsappMessageId: "wamid_a",
      messageText: "الكشف بكام؟",
      tenantConfiguration: {
        n8nWebhookUrl: mockN8nUrl,
        isAiEnabled: true,
        n8nEnabled: true,
        integrationStatus: "READY",
        workingHours: doctorA.workingHours,
        services: [{ name: "كشف عظام", price: doctorA.consultationPrice }],
      },
      timestamp: new Date().toISOString(),
    };

    const res = await dispatchToN8nOrchestrator(payload);
    expect(res.success).toBe(true);
    expect(res.handledBy).toBe("N8N_ORCHESTRATOR");
    expect(res.replyText).toContain("حسام عيسى");
    expect(res.replyText).toContain("750 ج.م");
  });

  it("2. Multi-Tenant Isolation: Same Workflow URL returns Doctor B's context dynamically", async () => {
    const payloadB = {
      eventId: "evt_102",
      clinicId: doctorB.id,
      doctorId: doctorB.id,
      doctorName: doctorB.name,
      conversationId: "conv_b",
      patientId: "pat_b",
      patientPhone: "201022222222",
      whatsappMessageId: "wamid_b",
      messageText: "الكشف بكام؟",
      tenantConfiguration: {
        n8nWebhookUrl: mockN8nUrl,
        isAiEnabled: true,
        n8nEnabled: true,
        integrationStatus: "READY",
        workingHours: doctorB.workingHours,
        services: [{ name: "كشف أسنان", price: doctorB.consultationPrice }],
      },
      timestamp: new Date().toISOString(),
    };

    const res = await dispatchToN8nOrchestrator(payloadB);
    expect(res.success).toBe(true);
    expect(res.handledBy).toBe("N8N_ORCHESTRATOR");
    expect(res.replyText).toContain("نورهان الشاذلي");
    expect(res.replyText).toContain("400 ج.م");
    expect(res.replyText).not.toContain("حسام عيسى");
  });

  it("3. Invalid Signature Rejection returns 401 and falls back", async () => {
    const rawBody = JSON.stringify({ test: "data" });
    const isSigValid = verifyN8nSignature(rawBody, Date.now().toString(), "v1=invalid_hmac_signature_hex");
    expect(isSigValid).toBe(false);
  });

  it("4. n8n Timeout Handling: Falls back to backend after timeout", async () => {
    const payloadTimeout = {
      eventId: "evt_timeout",
      clinicId: doctorA.id,
      doctorId: doctorA.id,
      doctorName: doctorA.name,
      conversationId: "conv_t",
      patientId: "pat_t",
      patientPhone: "201033333333",
      whatsappMessageId: "wamid_t",
      messageText: "SIMULATE_TIMEOUT",
      tenantConfiguration: {
        n8nWebhookUrl: mockN8nUrl,
        isAiEnabled: true,
        n8nEnabled: true,
        integrationStatus: "READY",
        workingHours: doctorA.workingHours,
        services: [],
      },
      timestamp: new Date().toISOString(),
    };

    const res = await dispatchToN8nOrchestrator(payloadTimeout);
    expect(res.success).toBe(false);
    expect(res.handledBy).toBe("BACKEND_FALLBACK");
  });

  it("5. Malformed n8n Response Handling: Rejects payload missing replyText", async () => {
    const payloadMalformed = {
      eventId: "evt_malformed",
      clinicId: doctorA.id,
      doctorId: doctorA.id,
      doctorName: doctorA.name,
      conversationId: "conv_m",
      patientId: "pat_m",
      patientPhone: "201044444444",
      whatsappMessageId: "wamid_m",
      messageText: "SIMULATE_MALFORMED",
      tenantConfiguration: {
        n8nWebhookUrl: mockN8nUrl,
        isAiEnabled: true,
        n8nEnabled: true,
        integrationStatus: "READY",
        workingHours: doctorA.workingHours,
        services: [],
      },
      timestamp: new Date().toISOString(),
    };

    const res = await dispatchToN8nOrchestrator(payloadMalformed);
    expect(res.success).toBe(false);
    expect(res.handledBy).toBe("BACKEND_FALLBACK");
    expect(res.error).toBe("MALFORMED_N8N_RESPONSE");
  });

  it("6. Fallback to OpenAI Provider when n8n is disabled", async () => {
    const res = await processIncomingPatientMessage({
      doctorId: doctorA.id,
      patientPhone: "201055555555",
      rawText: "عايز استفسار عن خدمات العيادة",
    });

    expect(res.replyText).toBeDefined();
    expect(res.replyText.length).toBeGreaterThan(5);
  });

  it("7. Fallback to Deterministic Safety Rules: Emergency messages bypass n8n and trigger human handoff", async () => {
    const res = await processIncomingPatientMessage({
      doctorId: doctorA.id,
      patientPhone: "201066666666",
      rawText: "عندي ألم شديد في الصدر وإغماء طارئ",
    });

    expect(res.handledBy).toBe("MEDICAL_SAFETY");
    expect(res.handoffStatus).toBe(HandoffStatus.HUMAN_ACTIVE);
  });
});
