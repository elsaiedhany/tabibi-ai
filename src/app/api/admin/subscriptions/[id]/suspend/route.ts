import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  if (session!.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "غير مصرح — مخصص لمدير النظام فقط" }, { status: 403 });
  }

  try {
    const subscription = await db.subscription.findUnique({ where: { id: params.id } });
    if (!subscription) {
      return NextResponse.json({ error: "الاشتراك غير موجود" }, { status: 404 });
    }

    const updatedSub = await db.subscription.update({
      where: { id: subscription.id },
      data: { status: "SUSPENDED" },
    });

    await logAuditEvent({
      doctorId: subscription.doctorId,
      action: "SUBSCRIPTION_SUSPENDED",
      details: `Subscription ${subscription.id} suspended by ${session!.email}`,
    });

    return NextResponse.json({
      success: true,
      message: "تم إيقاف اشتراك العيادة بنجاح.",
      subscription: updatedSub,
    });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ في إيقاف الاشتراك" }, { status: 500 });
  }
}
