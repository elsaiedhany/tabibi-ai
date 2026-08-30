import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest, isDoctorAccessAllowed } from "@/lib/auth";
import { sendPendingReminders } from "@/lib/reminders";
import { Role } from "@/types/index";

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const paramDoctorId = searchParams.get("doctorId");
  let targetDoctorId = session!.doctorId;

  if (paramDoctorId && session!.role === Role.SUPER_ADMIN) {
    targetDoctorId = paramDoctorId;
  } else if (paramDoctorId && paramDoctorId !== session!.doctorId) {
    return NextResponse.json({ error: "غير مصرح بإرسال تذكيرات لطبيب آخر" }, { status: 403 });
  }

  const result = await sendPendingReminders(targetDoctorId || undefined);
  return NextResponse.json({ success: true, sentCount: result.sentCount });
}
