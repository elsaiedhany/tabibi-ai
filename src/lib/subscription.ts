import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";

export interface SubscriptionStatusResult {
  allowed: boolean;
  status: "ACTIVE" | "TRIAL" | "EXPIRED" | "SUSPENDED" | "CANCELLED" | "NO_SUBSCRIPTION";
  plan?: string;
  trialEndsAt?: Date | null;
  daysRemaining?: number;
  message?: string;
}

/**
 * Server-side evaluation of doctor subscription status and feature access.
 * Performs automatic trial expiration checks based on server timestamp.
 */
export async function getDoctorSubscriptionStatus(doctorId: string): Promise<SubscriptionStatusResult> {
  if (!doctorId) {
    return {
      allowed: false,
      status: "NO_SUBSCRIPTION",
      message: "حساب الطبيب غير معروف",
    };
  }

  const subscription = await db.subscription.findFirst({
    where: { doctorId },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    // Check if doctor account itself is active for legacy compatibility
    const doctor = await db.doctor.findUnique({ where: { id: doctorId } });
    if (doctor && doctor.isActive) {
      return {
        allowed: true,
        status: "ACTIVE",
        plan: "PRO",
        message: "اشتراك مفتوح (Legacy Active Doctor)",
      };
    }

    return {
      allowed: false,
      status: "NO_SUBSCRIPTION",
      message: "لا يوجد اشتراك مفعّل لهذه العيادة",
    };
  }

  const now = new Date();

  // Handle SUSPENDED or CANCELLED status
  if (subscription.status === "SUSPENDED" || subscription.status === "CANCELLED") {
    return {
      allowed: false,
      status: subscription.status as any,
      plan: subscription.plan,
      message: "اشتراك العيادة موقوف أو ملغى حالياً. يرجى التواصل مع إدارة المنصة.",
    };
  }

  // Handle TRIAL status and automatic server-side trial expiration
  if (subscription.status === "TRIAL") {
    if (subscription.trialEndsAt && subscription.trialEndsAt < now) {
      // Automatically update status to EXPIRED in database
      await db.subscription.update({
        where: { id: subscription.id },
        data: { status: "EXPIRED" },
      });

      await logAuditEvent({
        doctorId,
        action: "SUBSCRIPTION_EXPIRED",
        details: `Free trial period expired automatically on ${now.toISOString()}`,
      });

      return {
        allowed: false,
        status: "EXPIRED",
        plan: subscription.plan,
        trialEndsAt: subscription.trialEndsAt,
        daysRemaining: 0,
        message: "انتهت الفترة التجريبية المجانية للعيادة. يرجى تفعيل الاشتراك للاستمرار.",
      };
    }

    const daysRemaining = subscription.trialEndsAt
      ? Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - now.getTime()) / 86400000))
      : 0;

    return {
      allowed: true,
      status: "TRIAL",
      plan: subscription.plan,
      trialEndsAt: subscription.trialEndsAt,
      daysRemaining,
      message: `الفترة التجريبية متبقي منها ${daysRemaining} أيام`,
    };
  }

  // Handle EXPIRED status
  if (subscription.status === "EXPIRED") {
    return {
      allowed: false,
      status: "EXPIRED",
      plan: subscription.plan,
      message: "اشتراك العيادة منتهي. يرجى تجديد الاشتراك للاستمرار.",
    };
  }

  // Handle ACTIVE status
  if (subscription.currentPeriodEnd && subscription.currentPeriodEnd < now) {
    await db.subscription.update({
      where: { id: subscription.id },
      data: { status: "EXPIRED" },
    });

    return {
      allowed: false,
      status: "EXPIRED",
      plan: subscription.plan,
      message: "انتهت فترة الاشتراك المدفوع. يرجى التجديد للاستمرار.",
    };
  }

  return {
    allowed: true,
    status: "ACTIVE",
    plan: subscription.plan,
    message: "الاشتراك نشط ومفاعل",
  };
}
