import { db } from "./db";
import { sendWhatsAppTextMessage } from "./whatsapp";
import { formatArabicTime } from "./calendar";

export async function sendPendingReminders(doctorId?: string): Promise<{ sentCount: number }> {
  const todayStr = new Date().toISOString().split("T")[0];

  const whereClause: any = {
    status: "SCHEDULED",
    reminderSent: false,
    date: { gte: todayStr },
  };

  if (doctorId) whereClause.doctorId = doctorId;

  const appointments = await db.appointment.findMany({
    where: whereClause,
    include: {
      doctor: { include: { reminders: true } },
      patient: true,
      service: true,
    },
  });

  let sentCount = 0;

  for (const app of appointments) {
    const reminderConfig = app.doctor.reminders.find((r) => r.isActive && r.type === "24H_BEFORE");

    const messageTemplate =
      reminderConfig?.templateText ||
      `أهلاً يا {patient_name}، بنفكرك إن معادك مع د. {doctor_name} بكرة الساعة {time} ({service_name}).\n\nلو حابب تعدل أو تلغي المعاد قولنا! 😊`;

    const body = messageTemplate
      .replace("{patient_name}", app.patient.name || "عزيزي المريض")
      .replace("{doctor_name}", app.doctor.name)
      .replace("{service_name}", app.service.name)
      .replace("{time}", formatArabicTime(app.time))
      .replace("{date}", app.date);

    await sendWhatsAppTextMessage(app.patient.whatsappNumber, body);

    await db.appointment.update({
      where: { id: app.id },
      data: { reminderSent: true },
    });

    sentCount++;
  }

  return { sentCount };
}
