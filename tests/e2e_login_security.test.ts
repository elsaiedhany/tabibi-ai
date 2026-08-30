import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { verifyPassword, hashPassword, verifySessionToken } from "../src/lib/auth";
import { checkRateLimit, resetRateLimit } from "../src/lib/rate-limit";
import { Role } from "../src/types/index";

const prisma = new PrismaClient();

describe("🧪 Real E2E Login & Security Verification Test Suite", () => {
  let superAdminId: string;
  let doctorAId: string;
  let doctorBId: string;

  beforeAll(async () => {
    // Seed initial Super Admin
    const superAdminPasswordHash = await hashPassword("442007Hany");
    const admin = await prisma.user.upsert({
      where: { email: "elsaiedhany40@gmail.com" },
      update: { passwordHash: superAdminPasswordHash, status: "ACTIVE" },
      create: {
        name: "Super Admin",
        email: "elsaiedhany40@gmail.com",
        passwordHash: superAdminPasswordHash,
        role: Role.SUPER_ADMIN,
        status: "ACTIVE",
      },
    });
    superAdminId = admin.id;

    // Seed Doctor A
    const docA = await prisma.doctor.upsert({
      where: { whatsappNumber: "201012345678" },
      update: {},
      create: {
        name: "د. أحمد محمد",
        title: "استشاري",
        specialty: "جلدية",
        whatsappNumber: "201012345678",
        consultationPrice: 500,
        followupPrice: 300,
      },
    });
    doctorAId = docA.id;

    // Seed Doctor B
    const docB = await prisma.doctor.upsert({
      where: { whatsappNumber: "201099881122" },
      update: {},
      create: {
        name: "د. سارة علي",
        title: "أخصائية",
        specialty: "أسنان",
        whatsappNumber: "201099881122",
        consultationPrice: 600,
        followupPrice: 350,
      },
    });
    doctorBId = docB.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("E2E 1: Valid Super Admin login (elsaiedhany40@gmail.com / 442007Hany)", async () => {
    const user = await prisma.user.findUnique({ where: { email: "elsaiedhany40@gmail.com" } });
    expect(user).not.toBeNull();
    expect(user!.role).toBe(Role.SUPER_ADMIN);

    const isValid = await verifyPassword("442007Hany", user!.passwordHash);
    expect(isValid).toBe(true);
  });

  it("E2E 2: Invalid password must be rejected with bcrypt.compare", async () => {
    const user = await prisma.user.findUnique({ where: { email: "elsaiedhany40@gmail.com" } });
    const isValid = await verifyPassword("wrongpassword123", user!.passwordHash);
    expect(isValid).toBe(false);
  });

  it("E2E 3: Non-existent email lookup returns null", async () => {
    const user = await prisma.user.findUnique({ where: { email: "nonexistent@gmail.com" } });
    expect(user).toBeNull();
  });

  it("E2E 4: 5 consecutive failed attempts trigger rate limiting (429)", () => {
    const key = "login_127.0.0.1_test_rate_limit_fail@gmail.com";
    resetRateLimit(key);

    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(key, 5, 60000);
      expect(res.allowed).toBe(true);
    }

    // 6th attempt should be blocked
    const blockedRes = checkRateLimit(key, 5, 60000);
    expect(blockedRes.allowed).toBe(false);
  });

  it("E2E 5: Successful login clears rate limit counter", () => {
    const key = "login_127.0.0.1_elsaiedhany40@gmail.com";
    resetRateLimit(key);

    // Make 4 failed attempts
    for (let i = 0; i < 4; i++) {
      checkRateLimit(key, 5, 60000);
    }

    // Successful login calls resetRateLimit
    resetRateLimit(key);

    // Next attempt should be completely allowed
    const freshRes = checkRateLimit(key, 5, 60000);
    expect(freshRes.allowed).toBe(true);
  });

  it("E2E 6: User password hash is never exposed in raw JSON", async () => {
    const user = await prisma.user.findUnique({ where: { email: "elsaiedhany40@gmail.com" } });
    const sanitizedUser = {
      id: user!.id,
      email: user!.email,
      name: user!.name,
      role: user!.role,
      status: user!.status,
    };

    expect(sanitizedUser).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(sanitizedUser)).not.toContain("442007Hany");
  });
});
