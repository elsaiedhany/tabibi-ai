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
    const plan = body.plan || "PRO";
    const periodMonths = Number(body.periodMonths) || 1;

    const subscription = await db.subscription.findUnique({ where: { id: params.id } });
    if (!subscription) {
      return NextResponse.json({ error: "الاشتراك غير موجود" }, { status: 404 });
    }

    const startDate = new Date();
    const currentPeriodEnd = new Date(startDate.getTime() + periodMonths * 30 * 86400000);

    const updatedSub = await db.subscription.update({
      where: { id: subscription.id },
      data: {
        plan,
        status: "ACTIVE",
        startDate,
        currentPeriodEnd,
        cancelledAt: null,
      },
    });

    await logAuditEvent({
      doctorId: subscription.doctorId,
      action: "SUBSCRIPTION_ACTIVATED",
      details: `Subscription ${subscription.id} activated by ${session!.email}. Plan: ${plan}, Period: ${periodMonths} months`,
    });

    return NextResponse.json({
      success: true,
      message: "تم تفعيل وتجديد الاشتراك بنجاح!",
      subscription: updatedSub,
    });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ في تفعيل الاشتراك" }, { status: 500 });
  }
}
