import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  if (session!.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "غير مصرح — مخصص لمدير النظام فقط" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    const where: any = {};
    if (statusFilter && ["PENDING", "APPROVED", "REJECTED"].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const applications = await db.doctorApplication.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, status: true, createdAt: true },
        },
        doctor: {
          select: { id: true, name: true, whatsappNumber: true, specialty: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      applications,
    });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ في تحميل طلبات الاشتراك" }, { status: 500 });
  }
}
