import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseWhatsAppWebhookPayload, resolveDoctorFromWhatsAppPayload } from "@/lib/whatsapp";
import { processIncomingPatientMessage } from "@/lib/message-processor";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || "tabibi_webhook_verify_secret";

  if (mode === "subscribe" && token) {
    // Check global token or doctor-specific verify token in DB
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
  try {
    const body = await req.json();
    const parsed = parseWhatsAppWebhookPayload(body);

    if (!parsed || !parsed.text) {
      return NextResponse.json({ status: "ignored_non_message" });
    }

    // 1. WAMID Idempotency Check: Prevent duplicate message processing
    if (parsed.messageId) {
      const existingMessage = await db.message.findFirst({
        where: { whatsappId: parsed.messageId },
      });

      if (existingMessage) {
        return NextResponse.json({ status: "ignored_duplicate", messageId: parsed.messageId });
      }
    }

    // 2. Multi-Tenant Doctor Resolution (From Meta Payload Metadata / Phone Number)
    const doctor = await resolveDoctorFromWhatsAppPayload(parsed);

    if (!doctor) {
      await logAuditEvent({ action: "UNRESOLVED_WHATSAPP_WEBHOOK", details: `Sender: ${parsed.from}` });
      return NextResponse.json({ error: "لم يتم العثور على حساب الطبيب المرتبط بالرقم" }, { status: 404 });
    }

    if (!doctor.isActive) {
      return NextResponse.json({ error: "حساب الطبيب موقوف حالياً" }, { status: 403 });
    }

    // 3. Server-Side Subscription Check
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

    // 4. Process Patient Message strictly scoped to resolved Doctor context
    const result = await processIncomingPatientMessage({
      doctorId: doctor.id,
      patientPhone: parsed.from,
      rawText: parsed.text,
      mediaType: parsed.mediaType,
      whatsappMessageId: parsed.messageId,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ status: "ignored_duplicate" }, { status: 200 });
    }
    return NextResponse.json({ error: "حدث خطأ في معالجة الويب هوك" }, { status: 500 });
  }
}
