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
    const body = await req.json().catch(() => ({}));
    const extendDays = Number(body.days) || 7;

    const subscription = await db.subscription.findUnique({ where: { id: params.id } });
    if (!subscription) {
      return NextResponse.json({ error: "الاشتراك غير موجود" }, { status: 404 });
    }

    const currentExpiry = subscription.trialEndsAt || subscription.currentPeriodEnd || new Date();
    const newExpiry = new Date(Math.max(currentExpiry.getTime(), Date.now()) + extendDays * 86400000);

    const updateData: any = {};
    if (subscription.status === "TRIAL") {
      updateData.trialEndsAt = newExpiry;
    } else {
      updateData.currentPeriodEnd = newExpiry;
      updateData.status = "ACTIVE";
    }

    const updatedSub = await db.subscription.update({
      where: { id: subscription.id },
      data: updateData,
    });

    await logAuditEvent({
      doctorId: subscription.doctorId,
      action: "SUBSCRIPTION_EXTENDED",
      details: `Subscription ${subscription.id} extended by ${extendDays} days by ${session!.email}`,
    });

    return NextResponse.json({
      success: true,
      message: `تم تمديد الاشتراك بمقدار ${extendDays} أيام بنجاح!`,
      subscription: updatedSub,
    });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ في تمديد الاشتراك" }, { status: 500 });
  }
}
