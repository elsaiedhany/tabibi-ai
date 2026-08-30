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
    const reason = body.reason || "بيانات الطلب تحتاج مراجعة وتوضيح أكثر";

    const application = await db.doctorApplication.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!application) {
      return NextResponse.json({ error: "طلب الاشتراك غير موجود" }, { status: 404 });
    }

    await db.$transaction([
      db.doctorApplication.update({
        where: { id: application.id },
        data: {
          status: "REJECTED",
          rejectionReason: reason,
          reviewedAt: new Date(),
          reviewedBy: session!.email,
        },
      }),
      db.user.update({
        where: { id: application.userId },
        data: { status: "REJECTED" },
      }),
    ]);

    await logAuditEvent({
      userId: application.userId,
      action: "APPLICATION_REJECTED",
      details: `Application rejected by ${session!.email}. Reason: ${reason}`,
    });

    return NextResponse.json({
      success: true,
      message: "تم رفض طلب الاشتراك وإشعار الطبيب بالسبب.",
    });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ غير متوقع أثناء رفض الطلب" }, { status: 500 });
  }
}
