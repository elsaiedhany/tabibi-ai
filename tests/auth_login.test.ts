import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { verifyPassword, hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

describe("Authentication & Production Accounts Verification", () => {
  beforeAll(async () => {
    // Clean legacy admin
    await prisma.user.deleteMany({ where: { email: "admin@tabibi.ai" } });

    const hash = await hashPassword("password123");
    const superAdminHash = await hashPassword("442007Hany");

    await prisma.user.upsert({
      where: { email: "ahmed@clinic.com" },
      update: { passwordHash: hash },
      create: { name: "د. أحمد محمد", email: "ahmed@clinic.com", passwordHash: hash, role: "DOCTOR" },
    });
    await prisma.user.upsert({
      where: { email: "elsaiedhany40@gmail.com" },
      update: { passwordHash: superAdminHash },
      create: { name: "Super Admin", email: "elsaiedhany40@gmail.com", passwordHash: superAdminHash, role: "SUPER_ADMIN" },
    });
    await prisma.user.upsert({
      where: { email: "reception@clinic.com" },
      update: { passwordHash: hash },
      create: { name: "Receptionist", email: "reception@clinic.com", passwordHash: hash, role: "STAFF" },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should verify doctor password hashing using bcrypt.compare correctly", async () => {
    const user = await prisma.user.findUnique({ where: { email: "ahmed@clinic.com" } });
    expect(user).toBeDefined();

    const isValid = await verifyPassword("password123", user!.passwordHash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword("wrongpassword", user!.passwordHash);
    expect(isInvalid).toBe(false);
  });

  it("should find Super Admin user elsaiedhany40@gmail.com with valid initial password hash", async () => {
    const admin = await prisma.user.findUnique({ where: { email: "elsaiedhany40@gmail.com" } });
    expect(admin).toBeDefined();
    expect(admin!.role).toBe("SUPER_ADMIN");

    const isValid = await verifyPassword("442007Hany", admin!.passwordHash);
    expect(isValid).toBe(true);
  });

  it("should find Receptionist user reception@clinic.com with valid password hash", async () => {
    const recep = await prisma.user.findUnique({ where: { email: "reception@clinic.com" } });
    expect(recep).toBeDefined();
    expect(recep!.role).toBe("STAFF");

    const isValid = await verifyPassword("password123", recep!.passwordHash);
    expect(isValid).toBe(true);
  });
});
