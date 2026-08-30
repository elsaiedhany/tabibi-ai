import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || typeof token !== "string" || !newPassword || typeof newPassword !== "string") {
      return NextResponse.json({ error: "الرمز أو كلمة المرور الجديدة مفقودة" }, { status: 400 });
    }

    // Password validation: At least 8 characters, containing letter and number
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تتكون من 8 أحرف على الأقل" }, { status: 400 });
    }

    const hasLetter = /[a-zA-Z\u0600-\u06FF]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    if (!hasLetter || !hasNumber) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تحتوي على أحرف وأرقام معاً" }, { status: 400 });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const resetToken = await db.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية" }, { status: 400 });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update user password and invalidate reset token in a transaction
    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: newPasswordHash },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    await logAuditEvent({
      userId: resetToken.userId,
      action: "PASSWORD_RESET_SUCCESS",
      details: "Password reset successfully via email token",
    });

    return NextResponse.json({
      success: true,
      message: "تم تحديث كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.",
    });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ غير متوقع في إعادة تعيين كلمة المرور" }, { status: 500 });
  }
}
