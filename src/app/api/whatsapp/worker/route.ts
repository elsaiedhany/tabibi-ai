import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWorkerAuth, WhatsAppQueueJob } from "@/lib/queue";
import { processIncomingPatientMessage } from "@/lib/message-processor";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const isAuthorized = await verifyWorkerAuth(req);
  if (!isAuthorized) {
    return NextResponse.json({ error: "غير مصرح بالوصول إلى ورشة معالجة المهام" }, { status: 401 });
  }

  try {
    const job: WhatsAppQueueJob = await req.json();
    const { doctorId, patientPhone, rawText, mediaType, whatsappMessageId } = job;

    if (!doctorId || !patientPhone || !rawText) {
      return NextResponse.json({ error: "بيانات مهمة الواتساب غير مكتملة" }, { status: 400 });
    }

    // 1. Load persisted Message record by WAMID
    let existingMsg = whatsappMessageId
      ? await db.message.findUnique({ where: { whatsappId: whatsappMessageId } })
      : null;

    if (existingMsg && existingMsg.processingState === "PROCESSED") {
      return NextResponse.json({ status: "already_processed", messageId: whatsappMessageId });
    }

    // 2. Mark Processing State
    if (existingMsg) {
      existingMsg = await db.message.update({
        where: { id: existingMsg.id },
        data: {
          processingState: "PROCESSING",
          attempts: { increment: 1 },
        },
      });
    }

    // 3. Execute Core Business Processing & AI Conversation Pipeline
    const result = await processIncomingPatientMessage({
      doctorId,
      patientPhone,
      rawText,
      mediaType,
      whatsappMessageId,
    });

    // 4. Mark Message as PROCESSED
    if (existingMsg) {
      await db.message.update({
        where: { id: existingMsg.id },
        data: {
          processingState: "PROCESSED",
          processedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("❌ Worker Execution Error:", error);

    try {
      const job: WhatsAppQueueJob = await req.json().catch(() => ({}));
      if (job.whatsappMessageId) {
        const msg = await db.message.findUnique({ where: { whatsappId: job.whatsappMessageId } });
        if (msg) {
          const newAttempts = msg.attempts + 1;
          const nextState = newAttempts >= 3 ? "DEAD_LETTER" : "FAILED";

          await db.message.update({
            where: { id: msg.id },
            data: {
              processingState: nextState,
              attempts: newAttempts,
              lastError: String(error.message || error).substring(0, 500),
            },
          });

          if (nextState === "DEAD_LETTER") {
            await logAuditEvent({
              doctorId: job.doctorId,
              action: "QUEUE_JOB_DEAD_LETTER",
              details: `WAMID ${job.whatsappMessageId} failed after ${newAttempts} attempts: ${error.message}`,
            });
          }
        }
      }
    } catch (_) {}

    return NextResponse.json({ error: "حدث خطأ أثناء تنفيذ مهمة الواتساب" }, { status: 500 });
  }
}
