import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  if (session!.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "غير مصرح — مخصص لمدير النظام فقط" }, { status: 403 });
  }

  try {
    const application = await db.doctorApplication.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { id: true, name: true, email: true, status: true, createdAt: true } },
        doctor: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "طلب الاشتراك غير موجود" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ في تحميل تفاصيل الطلب" }, { status: 500 });
  }
}
