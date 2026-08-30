import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { parseWhatsAppWebhookPayload, resolveDoctorFromWhatsAppPayload, sendWhatsAppTextMessage } from "../src/lib/whatsapp";
import { processIncomingPatientMessage } from "../src/lib/message-processor";

const prisma = new PrismaClient();

describe("📱 Meta WhatsApp Cloud API Production Integration Test Suite", () => {
  let docAId: string;
  let docBId: string;
  const metaPhoneIdA = "109283746501928";
  const metaPhoneIdB = "209283746501929";

  beforeAll(async () => {
    // Seed Doctor A
    const docA = await prisma.doctor.upsert({
      where: { whatsappNumber: "201012345678" },
      update: {},
      create: {
        name: "د. أحمد (WhatsApp Production Test A)",
        title: "استشاري",
        specialty: "جلدية",
        whatsappNumber: "201012345678",
        consultationPrice: 500,
        followupPrice: 300,
      },
    });
    docAId = docA.id;

    await prisma.doctorSettings.upsert({
      where: { doctorId: docAId },
      update: { whatsappPhoneNumberId: metaPhoneIdA, whatsappVerifyToken: "token_doc_a" },
      create: { doctorId: docAId, whatsappPhoneNumberId: metaPhoneIdA, whatsappVerifyToken: "token_doc_a" },
    });

    // Seed Doctor B
    const docB = await prisma.doctor.upsert({
      where: { whatsappNumber: "201099881122" },
      update: {},
      create: {
        name: "د. سارة (WhatsApp Production Test B)",
        title: "أخصائية",
        specialty: "أسنان",
        whatsappNumber: "201099881122",
        consultationPrice: 600,
        followupPrice: 350,
      },
    });
    docBId = docB.id;

    await prisma.doctorSettings.upsert({
      where: { doctorId: docBId },
      update: { whatsappPhoneNumberId: metaPhoneIdB, whatsappVerifyToken: "token_doc_b" },
      create: { doctorId: docBId, whatsappPhoneNumberId: metaPhoneIdB, whatsappVerifyToken: "token_doc_b" },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("1. Parses standard text message from Meta webhook payload", () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "201012345678", phone_number_id: metaPhoneIdA },
                messages: [
                  {
                    from: "201088887777",
                    id: "wamid.test_001",
                    timestamp: "1700000000",
                    text: { body: "الكشف بكام؟" },
                    type: "text",
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const parsed = parseWhatsAppWebhookPayload(payload);
    expect(parsed).not.toBeNull();
    expect(parsed!.from).toBe("201088887777");
    expect(parsed!.text).toBe("الكشف بكام؟");
    expect(parsed!.phoneNumberId).toBe(metaPhoneIdA);
  });

  it("2. Parses interactive button reply from Meta webhook payload", () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "201012345678", phone_number_id: metaPhoneIdA },
                messages: [
                  {
                    from: "201088887777",
                    id: "wamid.test_button_001",
                    timestamp: "1700000000",
                    type: "interactive",
                    interactive: {
                      type: "button_reply",
                      button_reply: { id: "btn_1", title: "كشف جلدية" },
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const parsed = parseWhatsAppWebhookPayload(payload);
    expect(parsed).not.toBeNull();
    expect(parsed!.text).toBe("كشف جلدية");
    expect(parsed!.buttonPayload).toBe("btn_1");
  });

  it("3. Multi-Tenant Resolution: Resolves Doctor A by phone_number_id A", async () => {
    const parsed = {
      from: "201088887777",
      phoneNumberId: metaPhoneIdA,
      text: "اختبار",
      messageId: "wamid_002",
      timestamp: "1700000000",
    };

    const doc = await resolveDoctorFromWhatsAppPayload(parsed);
    expect(doc).not.toBeNull();
    expect(doc.id).toBe(docAId);
  });

  it("4. Multi-Tenant Resolution: Resolves Doctor B by phone_number_id B", async () => {
    const parsed = {
      from: "201088887777",
      phoneNumberId: metaPhoneIdB,
      text: "اختبار",
      messageId: "wamid_003",
      timestamp: "1700000000",
    };

    const doc = await resolveDoctorFromWhatsAppPayload(parsed);
    expect(doc).not.toBeNull();
    expect(doc.id).toBe(docBId);
  });

  it("5. WAMID Idempotency: Message creation stores WAMID correctly", async () => {
    const wamid = `wamid.unique_test_${Date.now()}`;
    const res = await processIncomingPatientMessage({
      doctorId: docAId,
      patientPhone: "201055556666",
      rawText: "اختبار الدوبليكيت",
      whatsappMessageId: wamid,
    });

    expect(res.replyText).toBeDefined();

    const storedMsg = await prisma.message.findFirst({ where: { whatsappId: wamid } });
    expect(storedMsg).not.toBeNull();
    expect(storedMsg!.whatsappId).toBe(wamid);
  });

  it("6. Outbound recipient simulator mode executes cleanly without throwing", async () => {
    const outbound = await sendWhatsAppTextMessage("201012345678", "اختبار الرسائل الصادرة", docAId);
    expect(outbound.success).toBe(true);
  });
});
