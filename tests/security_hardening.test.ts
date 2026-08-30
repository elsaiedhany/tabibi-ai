import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { verifyPassword, hashPassword, createSessionToken, verifySessionToken, isDoctorAccessAllowed } from "../src/lib/auth";
import { checkRateLimit, resetRateLimit } from "../src/lib/rate-limit";
import { Role } from "../src/types/index";

const prisma = new PrismaClient();

describe("🔒 Security Hardening & Authorization Test Suite", () => {
  let superAdminId: string;
  let doctorAId: string;
  let doctorBId: string;
  let doctorAUserId: string;
  let doctorBUserId: string;
  let receptionistUserId: string;
  let suspendedUserId: string;

  beforeAll(async () => {
    const passwordHash = await hashPassword("password123");

    // Seed Doctor A
    const docA = await prisma.doctor.upsert({
      where: { whatsappNumber: "201888888881" },
      update: {},
      create: {
        name: "د. أسامة (Security Test A)",
        title: "استشاري",
        specialty: "جلدية",
        whatsappNumber: "201888888881",
        consultationPrice: 500.0,
        followupPrice: 300.0,
      },
    });
    doctorAId = docA.id;

    // Seed Doctor B
    const docB = await prisma.doctor.upsert({
      where: { whatsappNumber: "201888888882" },
      update: {},
      create: {
        name: "د. فاطمة (Security Test B)",
        title: "أخصائية",
        specialty: "أسنان",
        whatsappNumber: "201888888882",
        consultationPrice: 600.0,
        followupPrice: 350.0,
      },
    });
    doctorBId = docB.id;

    // Create Initial Super Admin User (elsaiedhany40@gmail.com)
    const adminPasswordHash = await hashPassword("442007Hany");
    const adminUser = await prisma.user.upsert({
      where: { email: "elsaiedhany40@gmail.com" },
      update: { passwordHash: adminPasswordHash, status: "ACTIVE" },
      create: { name: "Super Admin Test", email: "elsaiedhany40@gmail.com", passwordHash: adminPasswordHash, role: Role.SUPER_ADMIN, status: "ACTIVE" },
    });
    superAdminId = adminUser.id;

    // Create Doctor A User
    const docAUser = await prisma.user.upsert({
      where: { email: "sec_doca@tabibi.ai" },
      update: { passwordHash, status: "ACTIVE" },
      create: { name: "Doctor A Test", email: "sec_doca@tabibi.ai", passwordHash, role: Role.DOCTOR, status: "ACTIVE" },
    });
    doctorAUserId = docAUser.id;

    // Create Doctor B User
    const docBUser = await prisma.user.upsert({
      where: { email: "sec_docb@tabibi.ai" },
      update: { passwordHash, status: "ACTIVE" },
      create: { name: "Doctor B Test", email: "sec_docb@tabibi.ai", passwordHash, role: Role.DOCTOR, status: "ACTIVE" },
    });
    doctorBUserId = docBUser.id;

    // Create Receptionist User (assigned to Doctor A)
    const recepUser = await prisma.user.upsert({
      where: { email: "sec_recep@tabibi.ai" },
      update: { passwordHash, status: "ACTIVE" },
      create: { name: "Recep Test", email: "sec_recep@tabibi.ai", passwordHash, role: Role.STAFF, status: "ACTIVE" },
    });
    receptionistUserId = recepUser.id;

    // Create Suspended User
    const suspUser = await prisma.user.upsert({
      where: { email: "sec_suspended@tabibi.ai" },
      update: { passwordHash, status: "SUSPENDED" },
      create: { name: "Suspended Test", email: "sec_suspended@tabibi.ai", passwordHash, role: Role.DOCTOR, status: "SUSPENDED" },
    });
    suspendedUserId = suspUser.id;

    // Link doctor_users
    await prisma.doctorUser.upsert({
      where: { doctorId_userId: { doctorId: doctorAId, userId: doctorAUserId } },
      update: {},
      create: { doctorId: doctorAId, userId: doctorAUserId, role: Role.DOCTOR },
    });
    await prisma.doctorUser.upsert({
      where: { doctorId_userId: { doctorId: doctorBId, userId: doctorBUserId } },
      update: {},
      create: { doctorId: doctorBId, userId: doctorBUserId, role: Role.DOCTOR },
    });
  });

  afterAll(async () => {
    await prisma.doctor.deleteMany({ where: { id: { in: [doctorAId, doctorBId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [superAdminId, doctorAUserId, doctorBUserId, receptionistUserId, suspendedUserId] } } });
    await prisma.$disconnect();
  });

  it("1. Super Admin (elsaiedhany40@gmail.com) initial password verification", async () => {
    const user = await prisma.user.findUnique({ where: { email: "elsaiedhany40@gmail.com" } });
    expect(user).not.toBeNull();
    expect(user!.role).toBe(Role.SUPER_ADMIN);
    const isValid = await verifyPassword("442007Hany", user!.passwordHash);
    expect(isValid).toBe(true);
  });

  it("2. Legacy admin@tabibi.ai does NOT exist after seed update", async () => {
    const legacyAdmin = await prisma.user.findUnique({ where: { email: "admin@tabibi.ai" } });
    expect(legacyAdmin).toBeNull();
  });

  it("3. Password hashing must never store plaintext passwords", async () => {
    const user = await prisma.user.findUnique({ where: { email: "sec_doca@tabibi.ai" } });
    expect(user!.passwordHash).not.toBe("password123");
    expect(user!.passwordHash.startsWith("$2a$") || user!.passwordHash.startsWith("$2b$")).toBe(true);
  });

  it("4. Wrong password must be rejected with bcrypt.compare", async () => {
    const user = await prisma.user.findUnique({ where: { email: "sec_doca@tabibi.ai" } });
    const isValid = await verifyPassword("wrongpassword", user!.passwordHash);
    expect(isValid).toBe(false);
  });

  it("5. Doctor A cannot access Doctor B's doctorId scope", () => {
    const sessionA = { userId: doctorAUserId, email: "sec_doca@tabibi.ai", name: "Doc A", role: Role.DOCTOR, status: "ACTIVE" as const, doctorId: doctorAId };
    const isAllowed = isDoctorAccessAllowed(sessionA, doctorBId);
    expect(isAllowed).toBe(false);
  });

  it("6. Super Admin CAN access all doctorId scopes", () => {
    const adminSession = { userId: superAdminId, email: "elsaiedhany40@gmail.com", name: "Admin", role: Role.SUPER_ADMIN, status: "ACTIVE" as const };
    const isAllowed = isDoctorAccessAllowed(adminSession, doctorBId);
    expect(isAllowed).toBe(true);
  });

  it("7. Suspended user session token must be rejected upon verification", async () => {
    const token = await createSessionToken({
      userId: suspendedUserId,
      email: "sec_suspended@tabibi.ai",
      name: "Suspended",
      role: Role.DOCTOR,
      status: "SUSPENDED",
    });

    const verifiedSession = await verifySessionToken(token);
    expect(verifiedSession).toBeNull();
  });

  it("8. Login Rate Limiting must trigger 429 when max attempts exceeded", () => {
    const testKey = "test_ip_rate_limit_key_2";
    resetRateLimit(testKey);

    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(testKey, 5, 60000);
      expect(res.allowed).toBe(true);
    }

    const blockedRes = checkRateLimit(testKey, 5, 60000);
    expect(blockedRes.allowed).toBe(false);
  });
});
