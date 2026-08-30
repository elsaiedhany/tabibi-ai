import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, createSessionToken } from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validation";
import { logAuditEvent } from "@/lib/audit";
import { Role } from "@/types/index";

export async function POST(req: NextRequest) {
  try {
    const rawIp = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const ip = rawIp.trim();
    const body = await req.json().catch(() => ({}));
    const { email, password, selectedRole } = body;

    const cleanEmail = typeof email === "string" ? email.toLowerCase().trim() : "";

    // 1. Rate Limiting Check (Max 5 attempts per minute per IP + email)
    const rateLimitKey = `login_${ip}_${cleanEmail || "anon"}`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 60000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "تجاوزت عدد محاولات الدخول المسموح بها. يرجى الانتظار دقيقة وتكرار المحاولة." },
        { status: 429 }
      );
    }

    // 2. Input Validation
    if (!cleanEmail || !password || !isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
    }

    // 3. User Lookup
    const user = await db.user.findUnique({
      where: { email: cleanEmail },
      include: {
        doctorUsers: {
          include: { doctor: true },
        },
      },
    });

    if (!user) {
      await logAuditEvent({ action: "FAILED_LOGIN", details: `Non-existent email attempt: ${cleanEmail}` });
      return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
    }

    // 4. Account Status Check (ACTIVE vs SUSPENDED / DISABLED)
    if (user.status !== "ACTIVE") {
      await logAuditEvent({ userId: user.id, action: "SUSPENDED_LOGIN_ATTEMPT", details: `Status: ${user.status}` });
      return NextResponse.json({ error: "الحساب معطل أو موقوف. يرجى التواصل مع إدارة النظام." }, { status: 403 });
    }

    // 5. Password Verification
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await logAuditEvent({ userId: user.id, action: "FAILED_LOGIN", details: "Invalid password" });
      return NextResponse.json({ error: "بيانات الدخول غير صحيحة" }, { status: 401 });
    }

    // 6. Server-Side Role Enforcement Check
    if (selectedRole === "SUPER_ADMIN" && user.role !== Role.SUPER_ADMIN) {
      await logAuditEvent({ userId: user.id, action: "UNAUTHORIZED_ROLE_SELECTION", details: "Selected SUPER_ADMIN for non-admin user" });
      return NextResponse.json({ error: "الحساب ده مش مصرح له بالدخول إلى لوحة الإدارة." }, { status: 403 });
    }

    // 7. Reset Rate Limit counter on SUCCESSFUL password verification
    resetRateLimit(rateLimitKey);

    // 8. Doctor Context Resolution
    const firstDoctorUser = user.doctorUsers[0];
    let doctorId = firstDoctorUser?.doctorId;
    let doctorName = firstDoctorUser?.doctor?.name;

    if (!doctorId) {
      const defaultDoc = await db.doctor.findFirst({ orderBy: { createdAt: "asc" } });
      if (defaultDoc) {
        doctorId = defaultDoc.id;
        doctorName = defaultDoc.name;
      }
    }

    // Check if the doctor account itself is active
    if (doctorId) {
      const docRecord = await db.doctor.findUnique({ where: { id: doctorId } });
      if (docRecord && !docRecord.isActive && user.role !== Role.SUPER_ADMIN) {
        return NextResponse.json({ error: "حساب الطبيب موقوف حالياً" }, { status: 403 });
      }
    }

    // 9. Generate JWT Session Token
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      status: user.status as any,
      doctorId,
      doctorName,
    });

    await logAuditEvent({ doctorId, userId: user.id, action: "LOGIN", details: `Role: ${user.role}` });

    const redirectTo = user.role === Role.SUPER_ADMIN ? "/admin" : user.role === Role.STAFF ? "/staff" : "/doctor";

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        doctorId,
        doctorName,
      },
      redirectTo,
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
    return NextResponse.json({ error: "حدث خطأ غير متوقع في الخادم" }, { status: 500 });
  }
}
