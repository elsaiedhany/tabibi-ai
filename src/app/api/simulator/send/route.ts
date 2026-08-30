import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processIncomingPatientMessage } from "@/lib/message-processor";

export async function POST(req: NextRequest) {
  try {
    const { doctorId, patientPhone, message } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "الرسالة فارغة" }, { status: 400 });
    }

    const targetPhone = patientPhone || "201099887766";
    let targetDoctorId = doctorId;

    if (!targetDoctorId) {
      const defaultDoc = await db.doctor.findFirst({ where: { whatsappNumber: "201012345678" } });
      targetDoctorId = defaultDoc?.id;
    }

    if (!targetDoctorId) {
      return NextResponse.json({ error: "لم يتم العثور على حساب الطبيب" }, { status: 404 });
    }

    const output = await processIncomingPatientMessage({
      doctorId: targetDoctorId,
      patientPhone: targetPhone,
      rawText: message,
    });

    return NextResponse.json({
      success: true,
      output,
    });
  } catch (error) {
    console.error("Simulator execution error:", error);
    return NextResponse.json({ error: "فشل تنفيذ رسالة المحاكي" }, { status: 500 });
  }
}
