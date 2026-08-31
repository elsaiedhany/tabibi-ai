import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest, isDoctorAccessAllowed } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { Role } from "@/types/index";

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const paramId = searchParams.get("id");

  // 1. If specific doctor ID is explicitly requested via query parameter ?id=...
  if (paramId) {
    if (!isDoctorAccessAllowed(session!, paramId)) {
      return NextResponse.json({ error: "غير مصرح بالوصول لبيانات هذا الطبيب" }, { status: 403 });
    }

    const doctor = await db.doctor.findUnique({
      where: { id: paramId },
      include: {
        services: true,
        locations: true,
        settings: true,
        subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "الطبيب غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ doctor });
  }

  // 2. If user is DOCTOR or STAFF, return their single assigned doctor profile
  if (session!.role !== Role.SUPER_ADMIN) {
    if (!session!.doctorId) {
      return NextResponse.json({ error: "معرف الطبيب غير مرتبط بالحساب" }, { status: 400 });
    }

    const doctor = await db.doctor.findUnique({
      where: { id: session!.doctorId },
      include: {
        services: true,
        locations: true,
        settings: true,
        subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "الطبيب غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ doctor });
  }

  // 3. Super Admin view: return complete list of all registered doctors in system
  const doctors = await db.doctor.findMany({
    include: {
      services: true,
      locations: true,
      settings: true,
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ doctors });
}

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const {
    id,
    name,
    title,
    specialty,
    subSpecialty,
    gender,
    bio,
    experienceYears,
    consultationPrice,
    followupPrice,
    whatsappNumber,
    phone,
    workingHours,
    aiName,
    aiTone,
    isActive,
  } = body;

  const targetId = id || session!.doctorId;

  // Update existing doctor profile
  if (targetId) {
    if (!isDoctorAccessAllowed(session!, targetId)) {
      return NextResponse.json({ error: "غير مصرح بتعديل بيانات هذا الطبيب" }, { status: 403 });
    }

    const updated = await db.doctor.update({
      where: { id: targetId },
      data: {
        ...(name && { name }),
        ...(title && { title }),
        ...(specialty && { specialty }),
        ...(subSpecialty !== undefined && { subSpecialty }),
        ...(gender && { gender }),
        ...(bio !== undefined && { bio }),
        ...(experienceYears !== undefined && { experienceYears: parseInt(experienceYears, 10) }),
        ...(consultationPrice !== undefined && { consultationPrice: parseFloat(consultationPrice) }),
        ...(followupPrice !== undefined && { followupPrice: parseFloat(followupPrice) }),
        ...(whatsappNumber && { whatsappNumber }),
        ...(phone !== undefined && { phone }),
        ...(workingHours && { workingHours }),
        ...(aiName && { aiName }),
        ...(aiTone && { aiTone }),
        ...(isActive !== undefined && session!.role === Role.SUPER_ADMIN && { isActive }),
      },
      include: { services: true, locations: true, settings: true },
    });

    await logAuditEvent({ doctorId: targetId, userId: session!.userId, action: "DOCTOR_UPDATED" });
    return NextResponse.json({ success: true, doctor: updated });
  }

  // Create New Doctor (Restricted to SUPER_ADMIN)
  if (session!.role !== Role.SUPER_ADMIN) {
    return NextResponse.json({ error: "فقط مدير النظام (SUPER_ADMIN) يمكنه إضافة أطباء جدد" }, { status: 403 });
  }

  if (!name || !specialty || !whatsappNumber) {
    return NextResponse.json({ error: "اسم الطبيب والتخصص ورقم الواتساب مطلوبين" }, { status: 400 });
  }

  const newDoctor = await db.doctor.create({
    data: {
      name,
      title: title || "استشاري",
      specialty,
      whatsappNumber,
      consultationPrice: parseFloat(consultationPrice) || 500.0,
      followupPrice: parseFloat(followupPrice) || 300.0,
      workingHours: workingHours || "4 م - 10 م",
      aiName: aiName || "مريم",
    },
  });

  await logAuditEvent({ doctorId: newDoctor.id, userId: session!.userId, action: "DOCTOR_CREATED", details: name });
  return NextResponse.json({ success: true, doctor: newDoctor });
}
