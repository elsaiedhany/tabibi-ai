import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

import { sendEmailNotification } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  if (session!.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "غير مصرح — مخصص لمدير النظام فقط" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const plan = body.plan || "PRO";
    const subscriptionType = body.subscriptionType || "ACTIVE"; // ACTIVE or TRIAL
    const trialDays = Number(body.trialDays) || 7;

    const application = await db.doctorApplication.findUnique({
      where: { id: params.id },
      include: { user: true },
    });

    if (!application) {
      return NextResponse.json({ error: "طلب الاشتراك غير موجود" }, { status: 404 });
    }

    if (application.status === "APPROVED") {
      return NextResponse.json({ error: "هذا الطلب تمت الموافقة عليه بالفعل" }, { status: 400 });
    }

    // Parse Onboarding JSON data safely
    const docInfo = application.doctorData ? JSON.parse(application.doctorData) : {};
    const clinicInfo = application.clinicData ? JSON.parse(application.clinicData) : {};
    const servicesList = application.servicesData ? JSON.parse(application.servicesData) : [];

    const doctorName = docInfo.name || application.user.name;
    const specialty = docInfo.specialty || "طب عام";
    const title = docInfo.title || `استشاري ${specialty}`;
    const whatsappNumber = clinicInfo.whatsappNumber || docInfo.phone || `201${Math.floor(100000000 + Math.random() * 900000000)}`;

    const consultationPrice = Number(clinicInfo.consultationPrice) || 500;
    const followupPrice = Number(clinicInfo.followupPrice) || 300;
    const workingHours = clinicInfo.workingHours || "السبت إلى الخميس: 4:00 مساءً - 10:00 مساءً";

    const trialEndsAt = subscriptionType === "TRIAL" ? new Date(Date.now() + trialDays * 86400000) : null;
    const subStatus = subscriptionType === "TRIAL" ? "TRIAL" : "ACTIVE";

    // Perform ALL creations and status updates in a SINGLE ATOMIC TRANSACTION
    const result = await db.$transaction(async (tx) => {
      // 1. Create Doctor profile
      const doctor = await tx.doctor.create({
        data: {
          name: doctorName,
          title,
          specialty,
          consultationPrice,
          followupPrice,
          whatsappNumber,
          phone: docInfo.phone || application.user.email,
          email: application.user.email,
          workingHours,
          aiName: "مريم",
          aiTone: "EGYPTIAN_FRIENDLY",
          isActive: true,
        },
      });

      // 2. Create primary Clinic Location
      if (clinicInfo.clinicName || clinicInfo.address) {
        await tx.location.create({
          data: {
            doctorId: doctor.id,
            name: clinicInfo.clinicName || "الفرع الرئيسي",
            address: clinicInfo.address || "القاهرة",
            phone: clinicInfo.clinicPhone || whatsappNumber,
            isPrimary: true,
          },
        });
      }

      // 3. Create Clinic Services
      if (Array.isArray(servicesList) && servicesList.length > 0) {
        for (const s of servicesList) {
          if (s.name) {
            await tx.service.create({
              data: {
                doctorId: doctor.id,
                name: s.name,
                price: Number(s.price) || consultationPrice,
                durationMinutes: Number(s.durationMin) || 30,
              },
            });
          }
        }
      } else {
        // Create default consultation service
        await tx.service.create({
          data: {
            doctorId: doctor.id,
            name: `كشف ${specialty}`,
            price: consultationPrice,
            durationMinutes: 30,
          },
        });
      }

      // 4. Link Doctor User
      await tx.doctorUser.create({
        data: {
          doctorId: doctor.id,
          userId: application.userId,
          role: "DOCTOR",
        },
      });

      // 5. Create Subscription
      const subscription = await tx.subscription.create({
        data: {
          doctorId: doctor.id,
          plan,
          status: subStatus,
          startDate: new Date(),
          trialEndsAt,
        },
      });

      // 5.1 Create Initial Doctor Settings & Dynamic Tenant Integration State
      await tx.doctorSettings.create({
        data: {
          doctorId: doctor.id,
          isAiEnabled: true,
          n8nEnabled: false,
          integrationStatus: "READY",
          greetingTemplate: `أهلاً بحضرتك 👋 أنا مريم، المساعدة الخاصة بـ ${doctor.name}. إزاي أقدر أساعدك؟`,
          workingHoursTemplate: `مواعيد ${doctor.name}: ${workingHours}.`,
        },
      });

      // 6. Activate User Account
      await tx.user.update({
        where: { id: application.userId },
        data: { status: "ACTIVE" },
      });

      // 7. Mark Application APPROVED
      const approvedApp = await tx.doctorApplication.update({
        where: { id: application.id },
        data: {
          status: "APPROVED",
          doctorId: doctor.id,
          reviewedAt: new Date(),
          reviewedBy: session!.email,
        },
      });

      return { doctor, subscription, approvedApp };
    });

    await logAuditEvent({
      userId: application.userId,
      doctorId: result.doctor.id,
      action: "APPLICATION_APPROVED",
      details: `Application approved by ${session!.email}. Plan: ${plan}, Status: ${subStatus}`,
    });

    await sendEmailNotification({
      to: application.user.email,
      subject: "مرحباً بك في طبيبي! تم اعتماد حسابك وتفعيل عيادتك 🚀",
      template: "APPLICATION_APPROVED",
      data: { doctorName: result.doctor.name, plan },
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      message: "تمت الموافقة على طلب الدكتور وتفعيل العيادة والاشتراك بنجاح!",
      doctor: result.doctor,
      subscription: result.subscription,
    });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ غير متوقع أثناء اعتماد الطلب والتفعيل" }, { status: 500 });
  }
}
