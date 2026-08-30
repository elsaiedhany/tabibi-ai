import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("Doctor-Centric Tenancy & Data Isolation", () => {
  let doctorAId: string;
  let doctorBId: string;

  beforeAll(async () => {
    // Create Doctor A
    const docA = await prisma.doctor.create({
      data: {
        name: "د. أحمد علي (اختبار Isolation)",
        title: "استشاري الجلدية",
        specialty: "جلدية",
        whatsappNumber: "201000000001",
        consultationPrice: 500.0,
        followupPrice: 300.0,
      },
    });
    doctorAId = docA.id;

    // Create Doctor B
    const docB = await prisma.doctor.create({
      data: {
        name: "د. سارة عادل (اختبار Isolation)",
        title: "أخصائية الأسنان",
        specialty: "أسنان",
        whatsappNumber: "201000000002",
        consultationPrice: 600.0,
        followupPrice: 350.0,
      },
    });
    doctorBId = docB.id;

    // Create Patient & Conversation for Doctor A
    const patientA = await prisma.patient.create({
      data: { doctorId: doctorAId, whatsappNumber: "201111111111", name: "مريض دكتور أحمد" },
    });
    await prisma.conversation.create({
      data: { doctorId: doctorAId, patientId: patientA.id, state: "IDLE", handoffStatus: "AI_ACTIVE" },
    });

    // Create Patient & Conversation for Doctor B
    const patientB = await prisma.patient.create({
      data: { doctorId: doctorBId, whatsappNumber: "201222222222", name: "مريض دكتورة سارة" },
    });
    await prisma.conversation.create({
      data: { doctorId: doctorBId, patientId: patientB.id, state: "IDLE", handoffStatus: "AI_ACTIVE" },
    });

    // Create FAQ for Doctor A
    await prisma.faqEntry.create({
      data: { doctorId: doctorAId, question: "سؤال دكتور أحمد", normalizedQ: "سؤال دكتور احمد", answer: "إجابة خاصة بدكتور أحمد" },
    });
  });

  afterAll(async () => {
    await prisma.doctor.deleteMany({
      where: { id: { in: [doctorAId, doctorBId] } },
    });
    await prisma.$disconnect();
  });

  it("should enforce strict patient isolation between Doctor A and Doctor B", async () => {
    const patientsA = await prisma.patient.findMany({ where: { doctorId: doctorAId } });
    const patientsB = await prisma.patient.findMany({ where: { doctorId: doctorBId } });

    expect(patientsA).toHaveLength(1);
    expect(patientsA[0].name).toBe("مريض دكتور أحمد");

    expect(patientsB).toHaveLength(1);
    expect(patientsB[0].name).toBe("مريض دكتورة سارة");

    // Verify Doctor A query does not contain Doctor B patient
    const leakCheck = patientsA.find((p) => p.whatsappNumber === "201222222222");
    expect(leakCheck).toBeUndefined();
  });

  it("should enforce strict conversation isolation between Doctor A and Doctor B", async () => {
    const convsA = await prisma.conversation.findMany({ where: { doctorId: doctorAId } });
    const convsB = await prisma.conversation.findMany({ where: { doctorId: doctorBId } });

    expect(convsA).toHaveLength(1);
    expect(convsB).toHaveLength(1);
    expect(convsA[0].doctorId).toBe(doctorAId);
    expect(convsB[0].doctorId).toBe(doctorBId);
  });

  it("should enforce strict FAQ isolation between Doctor A and Doctor B", async () => {
    const faqsA = await prisma.faqEntry.findMany({ where: { doctorId: doctorAId } });
    const faqsB = await prisma.faqEntry.findMany({ where: { doctorId: doctorBId } });

    expect(faqsA).toHaveLength(1);
    expect(faqsA[0].question).toBe("سؤال دكتور أحمد");
    expect(faqsB).toHaveLength(0);
  });
});
