import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSessionToken } from "@/lib/auth";
import { isValidEmail } from "@/lib/validation";
import { logAuditEvent } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const ip = rawIp.trim();
    const rl = checkRateLimit(`register_${ip}`, 5, 60000);

    if (!rl.allowed) {
      return NextResponse.json(
        { error: "تجاوزت عدد محاولات التسجيل المسموح بها. يرجى الانتظار دقيقة." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password, name, phone } = body;

    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      return NextResponse.json({ error: "البريد الإلكتروني غير صحيح" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تتكون من 8 أحرف على الأقل" }, { status: 400 });
    }

    const hasLetter = /[a-zA-Z\u0600-\u06FF]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasLetter || !hasNumber) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تحتوي على أحرف وأرقام معاً" }, { status: 400 });
    }

    if (!name || typeof name !== "string" || name.trim().length < 3) {
      return NextResponse.json({ error: "يرجى كتابة الاسم الثلاثي للطبيب" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone ? phone.trim() : "";

    // Check existing user
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
      include: { applications: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (existingUser) {
      if (existingUser.status === "REJECTED") {
        // Allow re-application if previous request was rejected
        const newPasswordHash = await bcrypt.hash(password, 10);
        await db.user.update({
          where: { id: existingUser.id },
          data: {
            name: name.trim(),
            passwordHash: newPasswordHash,
            status: "PENDING_ONBOARDING",
          },
        });

        const app = await db.doctorApplication.create({
          data: {
            userId: existingUser.id,
            status: "PENDING",
            step: 1,
            doctorData: JSON.stringify({ name: name.trim(), email: cleanEmail, phone: cleanPhone }),
          },
        });

        const token = await createSessionToken({
          userId: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: "DOCTOR",
          status: "PENDING_ONBOARDING" as any,
        });

        const res = NextResponse.json({
          success: true,
          message: "تم تحديث بياناتك بنجاح. يرجى إكمال إعداد العيادة.",
          redirectTo: "/onboarding",
        });

        res.cookies.set("tabibi_session", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });

        return res;
      }

      return NextResponse.json({ error: "البريد الإلكتروني مسجل بالفعل بالنظام. يرجى تسجيل الدخول." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create User & DoctorApplication in a transaction
    const [user, application] = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: cleanEmail,
          name: name.trim(),
          passwordHash,
          role: "DOCTOR",
          status: "PENDING_ONBOARDING",
        },
      });

      const newApp = await tx.doctorApplication.create({
        data: {
          userId: newUser.id,
          status: "PENDING",
          step: 1,
          doctorData: JSON.stringify({ name: name.trim(), email: cleanEmail, phone: cleanPhone }),
        },
      });

      return [newUser, newApp];
    });

    await logAuditEvent({
      userId: user.id,
      action: "DOCTOR_REGISTERED",
      details: `Self-registration completed for ${cleanEmail}`,
    });

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: "DOCTOR",
      status: "PENDING_ONBOARDING" as any,
    });

    const res = NextResponse.json({
      success: true,
      message: "تم إنشاء حساب الطبيب بنجاح. يرجى إكمال إعداد العيادة.",
      redirectTo: "/onboarding",
    });

    res.cookies.set("tabibi_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Registration endpoint error:", error);
    return NextResponse.json({ error: "حدث خطأ غير متوقع أثناء التسجيل" }, { status: 500 });
  }
}
