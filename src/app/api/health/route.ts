import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  let dbStatus = "HEALTHY";
  let activeDoctorsCount = 0;
  let totalAppointmentsToday = 0;
  let totalAiUsageToday = 0;
  let queuedJobsCount = 0;
  let deadLetterJobsCount = 0;
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

    // 2. Check for System Warnings
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

    queuedJobsCount = await db.message.count({ where: { processingState: "QUEUED" } });
    deadLetterJobsCount = await db.message.count({ where: { processingState: "DEAD_LETTER" } });

    if (deadLetterJobsCount > 0) {
      systemAlerts.push(`تنبيه عاجل: يوجد ${deadLetterJobsCount} رسائل في Dead Letter Queue بحاجة للمراجعة`);
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
    queue: {
      backlogCount: queuedJobsCount,
      deadLetterCount: deadLetterJobsCount,
      mode: process.env.QSTASH_TOKEN ? "QSTASH" : "ASYNC_DISPATCH",
    },
    metrics: {
      activeDoctorsCount,
      totalAppointmentsToday,
      totalAiUsageCostTodayEgp: Math.round(totalAiUsageToday * 50 * 100) / 100,
    },
    alerts: systemAlerts,
  });
}
