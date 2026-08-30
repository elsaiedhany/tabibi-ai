import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { getDoctorSubscriptionStatus } from "../src/lib/subscription";

const prisma = new PrismaClient();

describe("💳 Subscription Enforcement & Admin Management Test Suite", () => {
  let doctorId: string;

  beforeAll(async () => {
    const doc = await prisma.doctor.create({
      data: {
        name: "د. تجربة الاشتراك",
        title: "استشاري",
        specialty: "باطنة",
        consultationPrice: 500,
        followupPrice: 300,
        whatsappNumber: "201099991111",
        workingHours: "السبت إلى الخميس",
      },
    });
    doctorId = doc.id;
  });

  afterAll(async () => {
    if (doctorId) {
      await prisma.subscription.deleteMany({ where: { doctorId } });
      await prisma.doctor.delete({ where: { id: doctorId } });
    }
    await prisma.$disconnect();
  });

  it("1. Returns allowed: true for active subscription", async () => {
    await prisma.subscription.create({
      data: {
        doctorId,
        plan: "PRO",
        status: "ACTIVE",
        startDate: new Date(),
      },
    });

    const status = await getDoctorSubscriptionStatus(doctorId);
    expect(status.allowed).toBe(true);
    expect(status.status).toBe("ACTIVE");
  });

  it("2. Returns allowed: true for active free trial", async () => {
    await prisma.subscription.deleteMany({ where: { doctorId } });

    const trialEndsAt = new Date(Date.now() + 7 * 86400000); // 7 days from now
    await prisma.subscription.create({
      data: {
        doctorId,
        plan: "PRO",
        status: "TRIAL",
        trialEndsAt,
      },
    });

    const status = await getDoctorSubscriptionStatus(doctorId);
    expect(status.allowed).toBe(true);
    expect(status.status).toBe("TRIAL");
    expect(status.daysRemaining).toBeGreaterThan(0);
  });

  it("3. Automatically expires trial in DB when trialEndsAt is in the past", async () => {
    await prisma.subscription.deleteMany({ where: { doctorId } });

    const expiredTrialEndsAt = new Date(Date.now() - 3600000); // 1 hour ago
    const sub = await prisma.subscription.create({
      data: {
        doctorId,
        plan: "PRO",
        status: "TRIAL",
        trialEndsAt: expiredTrialEndsAt,
      },
    });

    const status = await getDoctorSubscriptionStatus(doctorId);
    expect(status.allowed).toBe(false);
    expect(status.status).toBe("EXPIRED");

    const dbSub = await prisma.subscription.findUnique({ where: { id: sub.id } });
    expect(dbSub!.status).toBe("EXPIRED");
  });

  it("4. Returns allowed: false for SUSPENDED subscription", async () => {
    await prisma.subscription.deleteMany({ where: { doctorId } });

    await prisma.subscription.create({
      data: {
        doctorId,
        plan: "PRO",
        status: "SUSPENDED",
      },
    });

    const status = await getDoctorSubscriptionStatus(doctorId);
    expect(status.allowed).toBe(false);
    expect(status.status).toBe("SUSPENDED");
  });
});
