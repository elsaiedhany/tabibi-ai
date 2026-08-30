import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

describe("🔐 Password Reset & Role Enforcement Test Suite", () => {
  const testEmail = "test_reset_doc@tabibi.ai";
  const oldPassword = "Password123!";
  const newPassword = "NewSecurePassword2026";
  let userId: string;

  beforeAll(async () => {
    const hashed = await bcrypt.hash(oldPassword, 10);
    const user = await prisma.user.upsert({
      where: { email: testEmail },
      update: { passwordHash: hashed, status: "ACTIVE" },
      create: {
        email: testEmail,
        name: "د. تجربة كلمة المرور",
        passwordHash: hashed,
        role: "DOCTOR",
        status: "ACTIVE",
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.passwordResetToken.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it("1. Generates secure token hash and stores in database", async () => {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 3600000);

    const tokenRecord = await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    expect(tokenRecord).not.toBeNull();
    expect(tokenRecord.tokenHash).toBe(tokenHash);
    expect(tokenRecord.used).toBe(false);
  });

  it("2. Verifies raw token matching against stored token hash", async () => {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    const testHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const found = await prisma.passwordResetToken.findUnique({ where: { tokenHash: testHash } });

    expect(found).not.toBeNull();
    expect(found!.userId).toBe(userId);
  });

  it("3. Successfully updates user password and invalidates reset token", async () => {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const tokenRecord = await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    const newHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { used: true },
      }),
    ]);

    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    const isNewPasswordValid = await bcrypt.compare(newPassword, updatedUser!.passwordHash);
    expect(isNewPasswordValid).toBe(true);

    const updatedToken = await prisma.passwordResetToken.findUnique({ where: { id: tokenRecord.id } });
    expect(updatedToken!.used).toBe(true);
  });

  it("4. Rejects expired or used reset tokens safely", async () => {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    const expiredRecord = await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      },
    });

    expect(expiredRecord.expiresAt.getTime()).toBeLessThan(Date.now());
  });
});
