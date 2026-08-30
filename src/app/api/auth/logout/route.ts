import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getCurrentSession();
  if (session) {
    await logAuditEvent({ doctorId: session.doctorId, userId: session.userId, action: "LOGOUT" });
  }

  const res = NextResponse.json({ success: true, message: "تم تسجيل الخروج بنجاح" });
  res.cookies.delete("tabibi_session");
  return res;
}
