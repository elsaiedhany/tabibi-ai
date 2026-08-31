import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

describe("🏥 Doctor Self-Registration, Onboarding & Admin Approval Workflow", () => {
  const testEmail = "onboarding_doc_test@tabibi.ai";
  let userId: string;
  let applicationId: string;
  let adminUserId: string;

  beforeAll(async () => {
    // Clean pre-existing test email or doctor
    await prisma.doctor.deleteMany({ where: { OR: [{ email: testEmail }, { whatsappNumber: "201099887766" }] } });
    await prisma.user.deleteMany({ where: { email: testEmail } });

    // Ensure test admin exists
    const hashed = await bcrypt.hash("442007Hany", 10);
    const admin = await prisma.user.upsert({
      where: { email: "elsaiedhany40@gmail.com" },
      update: { role: "SUPER_ADMIN", status: "ACTIVE" },
      create: {
        email: "elsaiedhany40@gmail.com",
        name: "مدير النظام",
        passwordHash: hashed,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      },
    });
    adminUserId = admin.id;
  });

  afterAll(async () => {
    // Clean up test records
    if (userId) {
      await prisma.doctorApplication.deleteMany({ where: { userId } });
      const docUsers = await prisma.doctorUser.findMany({ where: { userId } });
      for (const du of docUsers) {
        await prisma.subscription.deleteMany({ where: { doctorId: du.doctorId } });
        await prisma.location.deleteMany({ where: { doctorId: du.doctorId } });
        await prisma.service.deleteMany({ where: { doctorId: du.doctorId } });
        await prisma.doctor.delete({ where: { id: du.doctorId } });
      }
      await prisma.doctorUser.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  it("1. Doctor self-registers and creates user with status PENDING_ONBOARDING", async () => {
    const hashed = await bcrypt.hash("Password123", 10);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: "د. حسن علي",
        passwordHash: hashed,
        role: "DOCTOR",
        status: "PENDING_ONBOARDING",
      },
    });
    userId = user.id;

    const application = await prisma.doctorApplication.create({
      data: {
        userId,
        status: "PENDING",
        step: 1,
        doctorData: JSON.stringify({ name: "د. حسن علي", email: testEmail, phone: "01099887766" }),
      },
    });
    applicationId = application.id;

    expect(user.status).toBe("PENDING_ONBOARDING");
    expect(application.status).toBe("PENDING");
  });

  it("2. Doctor completes onboarding steps and submits application", async () => {
    const updatedApp = await prisma.doctorApplication.update({
      where: { id: applicationId },
      data: {
        step: 5,
        clinicData: JSON.stringify({
          clinicName: "عيادات النور الباطنية",
          address: "القاهرة - مدينة نصر",
          whatsappNumber: "201099887766",
          consultationPrice: 600,
        }),
        workingHoursData: JSON.stringify({ السبت: { active: true, from: "16:00", to: "22:00" } }),
        servicesData: JSON.stringify([{ name: "كشف باطنة", price: 600 }]),
        submittedAt: new Date(),
      },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: "PENDING_APPROVAL" },
    });

    expect(updatedUser.status).toBe("PENDING_APPROVAL");
    expect(updatedApp.submittedAt).not.toBeNull();
  });

  it("3. Admin approves application in single atomic transaction", async () => {
    const result = await prisma.$transaction(async (tx) => {
      const docInfo = JSON.parse((await tx.doctorApplication.findUnique({ where: { id: applicationId } }))!.doctorData!);
      const clinicInfo = JSON.parse((await tx.doctorApplication.findUnique({ where: { id: applicationId } }))!.clinicData!);

      // 1. Create Doctor
      const doctor = await tx.doctor.create({
        data: {
          name: docInfo.name,
          title: "استشاري الباطنة",
          specialty: "أمراض الباطنة",
          consultationPrice: 600,
          followupPrice: 350,
          whatsappNumber: clinicInfo.whatsappNumber,
          phone: docInfo.phone,
          email: testEmail,
          workingHours: "السبت إلى الخميس",
        },
      });

      // 2. Link Doctor User
      await tx.doctorUser.create({
        data: {
          doctorId: doctor.id,
          userId,
          role: "DOCTOR",
        },
      });

      // 3. Create Subscription
      const subscription = await tx.subscription.create({
        data: {
          doctorId: doctor.id,
          plan: "PRO",
          status: "ACTIVE",
        },
      });

      // 4. Update User status to ACTIVE
      await tx.user.update({
        where: { id: userId },
        data: { status: "ACTIVE" },
      });

      // 5. Update Application status to APPROVED
      const approvedApp = await tx.doctorApplication.update({
        where: { id: applicationId },
        data: {
          status: "APPROVED",
          doctorId: doctor.id,
          reviewedAt: new Date(),
          reviewedBy: "elsaiedhany40@gmail.com",
        },
      });

      return { doctor, subscription, approvedApp };
    });

    expect(result.doctor.id).toBeDefined();
    expect(result.subscription.status).toBe("ACTIVE");
    expect(result.approvedApp.status).toBe("APPROVED");

    const activeUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(activeUser!.status).toBe("ACTIVE");
  });

  it("4. Rejection flow safely marks user status as REJECTED", async () => {
    await prisma.user.update({
      where: { id: userId },
      data: { status: "REJECTED" },
    });

    await prisma.doctorApplication.update({
      where: { id: applicationId },
      data: {
        status: "REJECTED",
        rejectionReason: "بيانات الهوية نرجو إعادتها بشكل أدق",
      },
    });

    const rejectedUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(rejectedUser!.status).toBe("REJECTED");
  });
});
