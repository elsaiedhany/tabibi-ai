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
    return NextResponse.json({ error: "غير مصرح بالوصول لفروع طبيب آخر" }, { status: 403 });
  }

  const locations = await db.location.findMany({
    where: { doctorId: targetDoctorId! },
    orderBy: { isPrimary: "desc" },
  });

  return NextResponse.json({ locations });
}

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const { name, address, googleMapsUrl, phone, workingHours, doctorId } = body;
  const targetDoctorId = doctorId || session!.doctorId;

  if (!isDoctorAccessAllowed(session!, targetDoctorId)) {
    return NextResponse.json({ error: "غير مصرح بإضافة فروع لهذا الطبيب" }, { status: 403 });
  }

  const location = await db.location.create({
    data: {
      doctorId: targetDoctorId,
      name,
      address,
      googleMapsUrl,
      phone,
      workingHours,
    },
  });

  return NextResponse.json({ success: true, location });
}

export async function DELETE(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "المعرف مفقود" }, { status: 400 });

  const location = await db.location.findUnique({ where: { id } });
  if (!location) return NextResponse.json({ error: "الفرع غير موجود" }, { status: 404 });

  if (!isDoctorAccessAllowed(session!, location.doctorId)) {
    return NextResponse.json({ error: "غير مصرح بحذف فروع طبيب آخر" }, { status: 403 });
  }

  await db.location.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
