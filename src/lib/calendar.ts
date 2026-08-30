import { db } from "./db";

export interface TimeSlot {
  time: string; // e.g. "16:00"
  displayTime: string; // e.g. "4:00 مساءً"
  available: boolean;
}

export function formatArabicTime(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "مساءً" : "صباحاً";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${mStr} ${period}`;
}

export async function checkDoctorAvailability(
  doctorId: string,
  dateStr: string
): Promise<TimeSlot[]> {
  const doctor = await db.doctor.findUnique({
    where: { id: doctorId },
  });

  if (!doctor || !doctor.isActive) return [];

  const defaultTimes = ["16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];

  const existingAppointments = await db.appointment.findMany({
    where: {
      doctorId,
      date: dateStr,
      status: { in: ["SCHEDULED", "RESCHEDULED"] },
    },
  });

  const bookedTimes = new Set(existingAppointments.map((a) => a.time));

  return defaultTimes.map((t) => ({
    time: t,
    displayTime: formatArabicTime(t),
    available: !bookedTimes.has(t),
  }));
}

export async function isSlotAvailable(
  doctorId: string,
  dateStr: string,
  timeStr: string
): Promise<boolean> {
  const existing = await db.appointment.findFirst({
    where: {
      doctorId,
      date: dateStr,
      time: timeStr,
      status: { in: ["SCHEDULED", "RESCHEDULED"] },
    },
  });
  return !existing;
}
