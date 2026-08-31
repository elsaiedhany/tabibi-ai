import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest, isDoctorAccessAllowed } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { getDoctorSubscriptionStatus } from "@/lib/subscription";
import { Role } from "@/types/index";

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const paramDoctorId = searchParams.get("doctorId");
  const status = searchParams.get("status");

  let targetDoctorId = session!.doctorId;

  if (paramDoctorId && session!.role === Role.SUPER_ADMIN) {
    targetDoctorId = paramDoctorId;
  } else if (paramDoctorId && paramDoctorId !== session!.doctorId) {
    return NextResponse.json({ error: "غير مصرح بالوصول لمواعيد طبيب آخر" }, { status: 403 });
  }

  if (!targetDoctorId) {
    return NextResponse.json({ error: "معرف الطبيب مفقود" }, { status: 400 });
  }

  const whereClause: any = { doctorId: targetDoctorId };
  if (status) whereClause.status = status;

  const appointments = await db.appointment.findMany({
    where: whereClause,
    include: {
      patient: true,
      service: true,
      location: true,
      doctor: true,
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  return NextResponse.json({ appointments });
}

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const { doctorId, patientId, serviceId, locationId, date, time, notes } = body;

  const targetDoctorId = doctorId || session!.doctorId;

  if (!isDoctorAccessAllowed(session!, targetDoctorId)) {
    return NextResponse.json({ error: "غير مصرح بتسجيل موعد لهذا الطبيب" }, { status: 403 });
  }

  // Server-side Subscription Enforcement
  const subStatus = await getDoctorSubscriptionStatus(targetDoctorId);
  if (!subStatus.allowed) {
    return NextResponse.json(
      { error: subStatus.message || "اشتراك العيادة منتهي أو موقوف. لا يمكن إضافة مواعيد جديدة." },
      { status: 402 }
    );
  }

  let targetPatientId = patientId;

  if (!targetPatientId && body.patientName && body.patientPhone) {
    let p = await db.patient.findUnique({
      where: { doctorId_whatsappNumber: { doctorId: targetDoctorId, whatsappNumber: body.patientPhone } },
    });

    if (!p) {
      p = await db.patient.create({
        data: {
          doctorId: targetDoctorId,
          name: body.patientName,
          whatsappNumber: body.patientPhone,
        },
      });
    }
    targetPatientId = p.id;
  }

  if (!targetPatientId) {
    return NextResponse.json({ error: "بيانات المريض مفقودة" }, { status: 400 });
  }

  // IDOR Protection: Check if patient belongs to targetDoctorId
  const patient = await db.patient.findUnique({ where: { id: targetPatientId } });
  if (!patient || patient.doctorId !== targetDoctorId) {
    return NextResponse.json({ error: "المريض غير تابع لهذا الطبيب" }, { status: 403 });
  }

  // Atomic Double Booking Check & Creation Transaction
  const appointment = await db.$transaction(async (tx) => {
    const existingSlot = await tx.appointment.findFirst({
      where: {
        doctorId: targetDoctorId,
        date,
        time,
        status: { in: ["SCHEDULED", "CONFIRMED", "RESCHEDULED"] },
      },
    });

    if (existingSlot) {
      throw new Error("DOUBLE_BOOKING_SLOT_TAKEN");
    }

    return await tx.appointment.create({
      data: {
        doctorId: targetDoctorId,
        patientId: targetPatientId,
        serviceId,
        locationId,
        date,
        time,
        notes,
      },
      include: { patient: true, service: true, location: true },
    });
  }).catch((err) => {
    if (err.message === "DOUBLE_BOOKING_SLOT_TAKEN") {
      return null;
    }
    throw err;
  });

  if (!appointment) {
    return NextResponse.json(
      { error: "هذا الموعد حُجز بالفعل من مريض آخر. يرجى اختيار موعد آخر متاح." },
      { status: 409 }
    );
  }

  await logAuditEvent({
    doctorId: targetDoctorId,
    userId: session!.userId,
    action: "APPOINTMENT_CREATED",
    details: `${date} ${time}`,
  });

  return NextResponse.json({ success: true, appointment });
}

export async function PATCH(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const { appointmentId, status, date, time } = body;

  const existing = await db.appointment.findUnique({ where: { id: appointmentId } });
  if (!existing) {
    return NextResponse.json({ error: "الموعد غير موجود" }, { status: 404 });
  }

  // IDOR Protection: Verify appointment ownership
  if (!isDoctorAccessAllowed(session!, existing.doctorId)) {
    return NextResponse.json({ error: "غير مصرح بتعديل هذا الموعد" }, { status: 403 });
  }

  const updated = await db.appointment.update({
    where: { id: appointmentId },
    data: {
      ...(status && { status }),
      ...(date && { date }),
      ...(time && { time }),
    },
    include: { patient: true, service: true, location: true },
  });

  await logAuditEvent({
    doctorId: existing.doctorId,
    userId: session!.userId,
    action: "APPOINTMENT_UPDATED",
    details: `Status: ${status || existing.status}`,
  });

  return NextResponse.json({ success: true, appointment: updated });
}
