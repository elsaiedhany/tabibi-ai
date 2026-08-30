import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const user = await db.user.findUnique({
      where: { id: session!.userId },
      include: {
        applications: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const application = user.applications[0] || null;

    return NextResponse.json({
      success: true,
      userStatus: user.status,
      application,
    });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ في تحميل بيانات الإعداد" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { step, doctorData, clinicData, workingHoursData, servicesData, submitApplication } = body;

    const user = await db.user.findUnique({
      where: { id: session!.userId },
      include: {
        applications: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    let application = user.applications[0];

    if (!application) {
      application = await db.doctorApplication.create({
        data: {
          userId: user.id,
          status: "PENDING",
          step: step || 1,
        },
      });
    }

    const updateData: any = {
      step: step || application.step,
    };

    if (doctorData) updateData.doctorData = typeof doctorData === "string" ? doctorData : JSON.stringify(doctorData);
    if (clinicData) updateData.clinicData = typeof clinicData === "string" ? clinicData : JSON.stringify(clinicData);
    if (workingHoursData) updateData.workingHoursData = typeof workingHoursData === "string" ? workingHoursData : JSON.stringify(workingHoursData);
    if (servicesData) updateData.servicesData = typeof servicesData === "string" ? servicesData : JSON.stringify(servicesData);

    if (submitApplication) {
      updateData.status = "PENDING";
      updateData.submittedAt = new Date();

      await db.$transaction([
        db.doctorApplication.update({
          where: { id: application.id },
          data: updateData,
        }),
        db.user.update({
          where: { id: user.id },
          data: { status: "PENDING_APPROVAL" },
        }),
      ]);

      await logAuditEvent({
        userId: user.id,
        action: "APPLICATION_SUBMITTED",
        details: `Doctor application ${application.id} submitted for review`,
      });

      return NextResponse.json({
        success: true,
        message: "تم تقديم طلب اشتراك العيادة بنجاح وهو قيد المراجعة حالياً.",
        status: "PENDING_APPROVAL",
      });
    }

    const updatedApp = await db.doctorApplication.update({
      where: { id: application.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      application: updatedApp,
    });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ في حفظ بيانات الإعداد" }, { status: 500 });
  }
}
