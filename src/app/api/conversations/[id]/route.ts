import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest, isDoctorAccessAllowed } from "@/lib/auth";
import { sendWhatsAppTextMessage } from "@/lib/whatsapp";
import { logAuditEvent } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  const conversation = await db.conversation.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      messages: { orderBy: { createdAt: "asc" } },
      appointments: { include: { service: true } },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });
  }

  // IDOR Protection: Ensure conversation belongs to authenticated doctor context
  if (!isDoctorAccessAllowed(session!, conversation.doctorId)) {
    return NextResponse.json({ error: "غير مصرح بالوصول لتفاصيل هذه المحادثة" }, { status: 403 });
  }

  return NextResponse.json({ conversation });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  const conversation = await db.conversation.findUnique({
    where: { id: params.id },
    include: { patient: true },
  });

  if (!conversation) {
    return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });
  }

  // IDOR Protection: Ensure conversation belongs to authenticated doctor context
  if (!isDoctorAccessAllowed(session!, conversation.doctorId)) {
    return NextResponse.json({ error: "غير مصرح بتعديل هذه المحادثة" }, { status: 403 });
  }

  const body = await req.json();
  const { handoffStatus, messageContent } = body;

  if (handoffStatus) {
    await db.conversation.update({
      where: { id: params.id },
      data: { handoffStatus },
    });
    await logAuditEvent({
      doctorId: conversation.doctorId,
      userId: session!.userId,
      action: "HANDOFF_STATUS_CHANGED",
      details: handoffStatus,
    });
  }

  if (messageContent && messageContent.trim()) {
    await sendWhatsAppTextMessage(conversation.patient.whatsappNumber, messageContent);

    await db.message.create({
      data: {
        conversationId: conversation.id,
        sender: "HUMAN_AGENT",
        content: messageContent,
        wasHandledByAi: false,
        ruleMatched: "HUMAN_RECEPTIONIST",
      },
    });

    await logAuditEvent({
      doctorId: conversation.doctorId,
      userId: session!.userId,
      action: "HUMAN_REPLY_SENT",
    });
  }

  const updated = await db.conversation.findUnique({
    where: { id: params.id },
    include: { patient: true, messages: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json({ success: true, conversation: updated });
}
