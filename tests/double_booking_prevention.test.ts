import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("🔒 Double Booking & Atomic Collision Prevention Test Suite", () => {
  let doctorId: string;
  let patientAId: string;
  let patientBId: string;
  let serviceId: string;

  beforeAll(async () => {
    const doc = await prisma.doctor.create({
      data: {
        name: "د. تجربة منع الحجز المكرر",
        title: "استشاري",
        specialty: "أسنان",
        consultationPrice: 500,
        followupPrice: 300,
        whatsappNumber: "201088887777",
        workingHours: "السبت إلى الخميس",
      },
    });
    doctorId = doc.id;

    const srv = await prisma.service.create({
      data: {
        doctorId,
        name: "كشف أسنان",
        price: 500,
        durationMinutes: 30,
      },
    });
    serviceId = srv.id;

    const pA = await prisma.patient.create({
      data: { doctorId, name: "مريض أ", whatsappNumber: "201011112222" },
    });
    patientAId = pA.id;

    const pB = await prisma.patient.create({
      data: { doctorId, name: "مريض ب", whatsappNumber: "201033334444" },
    });
    patientBId = pB.id;
  });

  afterAll(async () => {
    if (doctorId) {
      await prisma.appointment.deleteMany({ where: { doctorId } });
      await prisma.patient.deleteMany({ where: { doctorId } });
      await prisma.service.deleteMany({ where: { doctorId } });
      await prisma.doctor.delete({ where: { id: doctorId } });
    }
    await prisma.$disconnect();
  });

  it("1. Successfully books slot for Patient A", async () => {
    const app = await prisma.appointment.create({
      data: {
        doctorId,
        patientId: patientAId,
        serviceId,
        date: "2026-09-01",
        time: "18:00",
        status: "SCHEDULED",
      },
    });

    expect(app.id).toBeDefined();
    expect(app.status).toBe("SCHEDULED");
  });

  it("2. Atomic check prevents Patient B from double booking same doctor slot", async () => {
    const doubleBookingAttempt = await prisma.$transaction(async (tx) => {
      const existing = await tx.appointment.findFirst({
        where: {
          doctorId,
          date: "2026-09-01",
          time: "18:00",
          status: { in: ["SCHEDULED", "RESCHEDULED"] },
        },
      });

      if (existing) {
        return null; // Slot taken
      }

      return await tx.appointment.create({
        data: {
          doctorId,
          patientId: patientBId,
          serviceId,
          date: "2026-09-01",
          time: "18:00",
          status: "SCHEDULED",
        },
      });
    });

    expect(doubleBookingAttempt).toBeNull();

    // Verify only 1 appointment exists for doctor at that date/time
    const count = await prisma.appointment.count({
      where: {
        doctorId,
        date: "2026-09-01",
        time: "18:00",
        status: "SCHEDULED",
      },
    });

    expect(count).toBe(1);
  });
});
