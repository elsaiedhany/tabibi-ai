import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest, isDoctorAccessAllowed } from "@/lib/auth";
import { getDoctorAnalyticsSummary } from "@/lib/analytics";
import { Role } from "@/types/index";

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  // Receptionist (STAFF) is NOT allowed to view platform-wide analytics
  if (session!.role === Role.STAFF) {
    return NextResponse.json({ error: "غير مصرح للمستقبل برؤية التحليلات" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const paramDoctorId = searchParams.get("doctorId");
  let targetDoctorId = session!.doctorId;

  if (paramDoctorId && session!.role === Role.SUPER_ADMIN) {
    targetDoctorId = paramDoctorId;
  } else if (paramDoctorId && paramDoctorId !== session!.doctorId) {
    return NextResponse.json({ error: "غير مصرح بالوصول لتحليلات طبيب آخر" }, { status: 403 });
  }

  if (!targetDoctorId) {
    return NextResponse.json({ error: "معرف الطبيب مفقود" }, { status: 400 });
  }

  const summary = await getDoctorAnalyticsSummary(targetDoctorId);
  return NextResponse.json({ summary });
}
