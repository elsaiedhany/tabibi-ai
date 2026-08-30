import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/auth";
import { getDoctorSubscriptionStatus } from "@/lib/subscription";

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  if (!session!.doctorId) {
    return NextResponse.json({
      allowed: true,
      status: "ACTIVE",
      message: "حساب مدير النظام لا يتطلب اشتراك عيادة",
    });
  }

  try {
    const subStatus = await getDoctorSubscriptionStatus(session!.doctorId);
    return NextResponse.json({
      success: true,
      subscription: subStatus,
    });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ في قراءة حالة الاشتراك" }, { status: 500 });
  }
}
