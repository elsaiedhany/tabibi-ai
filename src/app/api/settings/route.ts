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
    return NextResponse.json({ error: "غير مصرح بالوصول لإعدادات طبيب آخر" }, { status: 403 });
  }

  const doctor = await db.doctor.findUnique({
    where: { id: targetDoctorId! },
    include: { settings: true, locations: true },
  });

  if (!doctor) return NextResponse.json({ error: "الطبيب غير موجود" }, { status: 404 });

  // Sanitize sensitive tokens before returning to client unless user is SUPER_ADMIN or exact DOCTOR
  const sanitizedDoctor = {
    ...doctor,
    settings: doctor.settings
      ? {
          ...doctor.settings,
          whatsappAccessToken: doctor.settings.whatsappAccessToken ? "••••••••" : null,
          whatsappVerifyToken: doctor.settings.whatsappVerifyToken ? "••••••••" : null,
        }
      : null,
  };

  return NextResponse.json({ doctor: sanitizedDoctor });
}

export async function PATCH(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const {
    doctorId,
    name,
    title,
    specialty,
    consultationPrice,
    followupPrice,
    phone,
    whatsappNumber,
    workingHours,
    aiName,
    aiTone,
    maxDailyAiBudget,
    maxAiCallsPerDay,
    isAiEnabled,
    greetingTemplate,
    workingHoursTemplate,
    handoffTemplate,
    whatsappAccessToken,
    whatsappPhoneNumberId,
    whatsappVerifyToken,
  } = body;

  const targetDoctorId = doctorId || session!.doctorId;

  if (!isDoctorAccessAllowed(session!, targetDoctorId)) {
    return NextResponse.json({ error: "غير مصرح بتعديل إعدادات هذا الطبيب" }, { status: 403 });
  }

  const doctor = await db.doctor.update({
    where: { id: targetDoctorId },
    data: {
      ...(name && { name }),
      ...(title && { title }),
      ...(specialty && { specialty }),
      ...(consultationPrice !== undefined && { consultationPrice: parseFloat(consultationPrice) }),
      ...(followupPrice !== undefined && { followupPrice: parseFloat(followupPrice) }),
      ...(phone && { phone }),
      ...(whatsappNumber && { whatsappNumber }),
      ...(workingHours && { workingHours }),
      ...(aiName && { aiName }),
      ...(aiTone && { aiTone }),
      ...(maxDailyAiBudget !== undefined && session!.role === Role.SUPER_ADMIN && { maxDailyAiBudget: parseFloat(maxDailyAiBudget) }),
      ...(maxAiCallsPerDay !== undefined && session!.role === Role.SUPER_ADMIN && { maxAiCallsPerDay: parseInt(maxAiCallsPerDay, 10) }),
    },
  });

  const {
    n8nEnabled,
    n8nWebhookUrl,
    customSystemPrompt,
    integrationStatus,
  } = body;

  await db.doctorSettings.upsert({
    where: { doctorId: targetDoctorId },
    update: {
      ...(isAiEnabled !== undefined && { isAiEnabled: Boolean(isAiEnabled) }),
      ...(n8nEnabled !== undefined && { n8nEnabled: Boolean(n8nEnabled) }),
      ...(n8nWebhookUrl !== undefined && { n8nWebhookUrl }),
      ...(customSystemPrompt !== undefined && { customSystemPrompt }),
      ...(integrationStatus !== undefined && { integrationStatus }),
      ...(greetingTemplate && { greetingTemplate }),
      ...(workingHoursTemplate && { workingHoursTemplate }),
      ...(handoffTemplate && { handoffTemplate }),
      ...(whatsappAccessToken && whatsappAccessToken !== "••••••••" && { whatsappAccessToken }),
      ...(whatsappPhoneNumberId && { whatsappPhoneNumberId }),
      ...(whatsappVerifyToken && whatsappVerifyToken !== "••••••••" && { whatsappVerifyToken }),
    },
    create: {
      doctorId: targetDoctorId,
      isAiEnabled: isAiEnabled !== undefined ? Boolean(isAiEnabled) : true,
      n8nEnabled: n8nEnabled !== undefined ? Boolean(n8nEnabled) : false,
      n8nWebhookUrl,
      customSystemPrompt,
      integrationStatus: integrationStatus || "READY",
      greetingTemplate: greetingTemplate || "أهلاً بك 👋 أنا مريم المساعدة الخاصة بدكتور أحمد. إزاي أقدر أساعدك؟",
      workingHoursTemplate: workingHoursTemplate || "مواعيد الدكتور من السبت للخميس 4 م لـ 10 م.",
      handoffTemplate: handoffTemplate || "تم تحويل المحادثة لمساعد الاستقبال الخاص بدكتور أحمد.",
      whatsappAccessToken,
      whatsappPhoneNumberId,
      whatsappVerifyToken,
    },
  });

  return NextResponse.json({ success: true, doctor });
}
