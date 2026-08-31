import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseWhatsAppWebhookPayload, resolveDoctorFromWhatsAppPayload } from "@/lib/whatsapp";
import { publishWhatsAppWorkerJob } from "@/lib/queue";
import { logAuditEvent } from "@/lib/audit";
import { normalizeText } from "@/lib/arabic";
import { detectIntent } from "@/lib/intent";
import { ConversationState, HandoffStatus } from "@/types/index";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || "tabibi_webhook_verify_secret";

  if (mode === "subscribe" && token) {
    if (token === expectedToken) {
      return new NextResponse(challenge || "OK", { status: 200 });
    }

    const doctorSetting = await db.doctorSettings.findFirst({
      where: { whatsappVerifyToken: token },
    });

    if (doctorSetting) {
      return new NextResponse(challenge || "OK", { status: 200 });
    }
  }

  return NextResponse.json({ error: "التحقق من التوكن فشل - غير مصرح" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  try {
    const body = await req.json();
    const parsed = parseWhatsAppWebhookPayload(body);

    if (!parsed || !parsed.text) {
      return NextResponse.json({ status: "ignored_non_message" });
    }

    // 1. WAMID Idempotency Check: Instant return if already processed/queued
    if (parsed.messageId) {
      const existingMessage = await db.message.findUnique({
        where: { whatsappId: parsed.messageId },
      });

      if (existingMessage) {
        return NextResponse.json({ status: "ignored_duplicate", messageId: parsed.messageId });
      }
    }

    // 2. Multi-Tenant Doctor Resolution
    const doctor = await resolveDoctorFromWhatsAppPayload(parsed);

    if (!doctor) {
      await logAuditEvent({ action: "UNRESOLVED_WHATSAPP_WEBHOOK", details: `Sender: ${parsed.from}` });
      return NextResponse.json({ error: "لم يتم العثور على حساب الطبيب المرتبط بالرقم" }, { status: 404 });
    }

    if (!doctor.isActive) {
      return NextResponse.json({ error: "حساب الطبيب موقوف حالياً" }, { status: 403 });
    }

    // 3. Subscription Check
    const { getDoctorSubscriptionStatus } = await import("@/lib/subscription");
    const subStatus = await getDoctorSubscriptionStatus(doctor.id);

    if (!subStatus.allowed) {
      await logAuditEvent({
        doctorId: doctor.id,
        action: "WHATSAPP_WEBHOOK_SUBSCRIPTION_EXPIRED",
        details: `Webhook message from ${parsed.from} ignored due to subscription status: ${subStatus.status}`,
      });
      return NextResponse.json({ error: "اشتراك الطبيب منتهي أو موقوف", status: subStatus.status }, { status: 402 });
    }

    // 4. Fast Patient & Conversation Resolution
    let patient = await db.patient.findUnique({
      where: { doctorId_whatsappNumber: { doctorId: doctor.id, whatsappNumber: parsed.from } },
    });

    if (!patient) {
      try {
        patient = await db.patient.create({
          data: {
            doctorId: doctor.id,
            whatsappNumber: parsed.from,
            name: `مريض (${parsed.from.slice(-4)})`,
          },
        });
      } catch (err: any) {
        if (err?.code === "P2002") {
          patient = (await db.patient.findUnique({
            where: { doctorId_whatsappNumber: { doctorId: doctor.id, whatsappNumber: parsed.from } },
          }))!;
        } else {
          throw err;
        }
      }
    }

    let conversation = await db.conversation.findFirst({
      where: { doctorId: doctor.id, patientId: patient.id },
    });

    if (!conversation) {
      try {
        conversation = await db.conversation.create({
          data: {
            doctorId: doctor.id,
            patientId: patient.id,
            state: ConversationState.IDLE,
            handoffStatus: HandoffStatus.AI_ACTIVE,
          },
        });
      } catch (_) {
        conversation = (await db.conversation.findFirst({
          where: { doctorId: doctor.id, patientId: patient.id },
        }))!;
      }
    }

    const normText = normalizeText(parsed.text);
    const detected = detectIntent(parsed.text);

    // 5. Persist Durable Message Record with QUEUED state
    try {
      await db.message.create({
        data: {
          conversationId: conversation.id,
          sender: "PATIENT",
          content: parsed.text,
          normalizedText: normText,
          detectedIntent: detected.intent,
          status: "received",
          whatsappId: parsed.messageId || undefined,
          processingState: "QUEUED",
          queuedAt: new Date(),
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        return NextResponse.json({ status: "ignored_duplicate", messageId: parsed.messageId }, { status: 200 });
      }
      throw err;
    }

    // 6. Publish Job to Queue & Return Instant HTTP 200 OK (< 50ms)
    await publishWhatsAppWorkerJob({
      doctorId: doctor.id,
      patientPhone: parsed.from,
      rawText: parsed.text,
      mediaType: parsed.mediaType,
      whatsappMessageId: parsed.messageId || `synthetic_${Date.now()}`,
      queuedAt: new Date().toISOString(),
    });

    const durationMs = Math.round(performance.now() - startTime);

    return NextResponse.json({
      success: true,
      status: "queued",
      messageId: parsed.messageId,
      durationMs,
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ status: "ignored_duplicate" }, { status: 200 });
    }
    return NextResponse.json({ error: "حدث خطأ في معالجة الويب هوك" }, { status: 500 });
  }
}
