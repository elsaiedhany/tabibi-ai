import { db } from "./db";

export async function logAuditEvent(params: {
  doctorId?: string;
  userId?: string;
  action: string;
  details?: string;
}): Promise<void> {
  try {
    const { doctorId, userId, action, details } = params;

    // Use default doctor if not specified for system-wide logs
    let targetDoctorId = doctorId;
    if (!targetDoctorId) {
      const defaultDoc = await db.doctor.findFirst({ orderBy: { createdAt: "asc" } });
      targetDoctorId = defaultDoc?.id;
    }

    if (!targetDoctorId) return;

    await db.auditLog.create({
      data: {
        doctorId: targetDoctorId,
        userId: userId || null,
        action,
        details: details || null,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}
