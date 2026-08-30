import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest } from "@/lib/auth";
import { Role } from "@/types/index";

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  let dbStatus = "HEALTHY";
  let activeDoctorsCount = 0;
  let totalAppointmentsToday = 0;
  let totalAiUsageToday = 0;
  let systemAlerts: string[] = [];

  try {
    // 1. Check Database Connectivity
    activeDoctorsCount = await db.doctor.count({ where: { isActive: true } });

    const todayStr = new Date().toISOString().split("T")[0];
    totalAppointmentsToday = await db.appointment.count({ where: { date: todayStr } });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const aiAgg = await db.aiUsage.aggregate({
      where: { timestamp: { gte: todayStart } },
      _sum: { estimatedCost: true },
      _count: { id: true },
    });
    totalAiUsageToday = aiAgg._sum.estimatedCost || 0;

    // 2. Check for System Warnings (Unconfigured WhatsApp tokens or high error rates)
    const docsWithoutToken = await db.doctorSettings.count({
      where: { whatsappAccessToken: null },
    });

    if (docsWithoutToken > 0) {
      systemAlerts.push(`يوجد ${docsWithoutToken} أطباء بدون توكن Meta WhatsApp مفعل`);
    }

    const failedMessagesCount = await db.message.count({
      where: {
        createdAt: { gte: todayStart },
        status: "failed",
      },
    });

    if (failedMessagesCount > 0) {
      systemAlerts.push(`تنبيه: فشل إرسال ${failedMessagesCount} رسائل واتساب اليوم`);
    }
  } catch (error) {
    dbStatus = "UNHEALTHY";
    systemAlerts.push("عطل في الاتصال بقاعدة البيانات");
  }

  const responseTimeMs = Date.now() - startTime;

  return NextResponse.json({
    status: dbStatus === "HEALTHY" && systemAlerts.length === 0 ? "OK" : "WARNING",
    timestamp: new Date().toISOString(),
    responseTimeMs,
    database: dbStatus,
    metrics: {
      activeDoctorsCount,
      totalAppointmentsToday,
      totalAiUsageCostTodayEgp: totalAiUsageToday,
    },
    alerts: systemAlerts,
  });
}
