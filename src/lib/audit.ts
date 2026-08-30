import { db } from "./db";

export async function logAuditEvent(params: {
  doctorId?: string;
  userId?: string;
  action: string;
  details?: string;
}): Promise<void> {
  try {
    const { doctorId, userId, action, details } = params;

    await db.auditLog.create({
      data: {
        doctorId: doctorId || null,
        userId: userId || null,
        action,
        details: details || null,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}
