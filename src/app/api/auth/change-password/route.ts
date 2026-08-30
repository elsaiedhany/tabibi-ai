import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest, verifyPassword, hashPassword } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "كلمة المرور الجديدة غير متطابقة" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: session!.userId } });
    if (!user) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
    }

    const newPasswordHash = await hashPassword(newPassword);

    await db.user.update({
      where: { id: session!.userId },
      data: { passwordHash: newPasswordHash },
    });

    await logAuditEvent({
      doctorId: session!.doctorId,
      userId: session!.userId,
      action: "PASSWORD_CHANGED",
    });

    return NextResponse.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
  } catch (error) {
    return NextResponse.json({ error: "حدث خطأ أثناء تغيير كلمة المرور" }, { status: 500 });
  }
}
