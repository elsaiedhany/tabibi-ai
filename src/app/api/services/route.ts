import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest, isDoctorAccessAllowed } from "@/lib/auth";
import { Role } from "@/types/index";

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const paramDoctorId = searchParams.get("doctorId");
  let targetDoctorId = session!.doctorId;

  if (paramDoctorId && session!.role === Role.SUPER_ADMIN) {
    targetDoctorId = paramDoctorId;
  } else if (paramDoctorId && paramDoctorId !== session!.doctorId) {
    return NextResponse.json({ error: "غير مصرح بالوصول لخدمات طبيب آخر" }, { status: 403 });
  }

  const services = await db.service.findMany({
    where: { doctorId: targetDoctorId! },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ services });
}

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const { name, description, price, durationMinutes, doctorId } = body;
  const targetDoctorId = doctorId || session!.doctorId;

  if (!isDoctorAccessAllowed(session!, targetDoctorId)) {
    return NextResponse.json({ error: "غير مصرح لإضافة خدمات لهذا الطبيب" }, { status: 403 });
  }

  const service = await db.service.create({
    data: {
      doctorId: targetDoctorId,
      name,
      description,
      price: parseFloat(price),
      durationMinutes: parseInt(durationMinutes, 10) || 30,
    },
  });

  return NextResponse.json({ success: true, service });
}

export async function DELETE(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "المعرف مفقود" }, { status: 400 });

  const service = await db.service.findUnique({ where: { id } });
  if (!service) return NextResponse.json({ error: "الخدمة غير موجودة" }, { status: 404 });

  if (!isDoctorAccessAllowed(session!, service.doctorId)) {
    return NextResponse.json({ error: "غير مصرح بحذف خدمات طبيب آخر" }, { status: 403 });
  }

  await db.service.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
