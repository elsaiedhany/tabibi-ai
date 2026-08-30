import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local_ip";
    const rl = checkRateLimit(`forgot_pw_${ip}`, 3, 900000); // 3 requests per 15 minutes
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "تجاوزت عدد طلبات استعادة كلمة المرور المسموح بها. يرجى الانتظار 15 دقيقة." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "يرجى كتابة البريد الإلكتروني بشكل صحيح" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await db.user.findUnique({ where: { email: normalizedEmail } });

    if (user && user.status === "ACTIVE") {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      const expiresAt = new Date(Date.now() + 3600000); // 1 hour expiration

      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      await logAuditEvent({
        userId: user.id,
        action: "PASSWORD_RESET_REQUESTED",
        details: `Reset token issued for user ID ${user.id}`,
      });

      // In production environment, send reset email via SendGrid / Resend / AWS SES.
      // For local test validation, log sanitized status securely without exposing token in plaintext logs.
    }

    // Always return generic response to prevent user enumeration attacks
    return NextResponse.json({
      success: true,
      message: "لو البريد الإلكتروني مسجل عندنا، هيوصلك رابط لإعادة تعيين كلمة المرور.",
    });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ غير متوقع في طلب استعادة كلمة المرور" }, { status: 500 });
  }
}
