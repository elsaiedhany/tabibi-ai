import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest, isDoctorAccessAllowed } from "@/lib/auth";
import { Role } from "@/types/index";

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const paramDoctorId = searchParams.get("doctorId");
  const statusFilter = searchParams.get("status");

  let targetDoctorId = session!.doctorId;

  if (paramDoctorId && session!.role === Role.SUPER_ADMIN) {
    targetDoctorId = paramDoctorId;
  } else if (paramDoctorId && paramDoctorId !== session!.doctorId) {
    return NextResponse.json({ error: "غير مصرح بالوصول لمحادثات طبيب آخر" }, { status: 403 });
  }

  if (!targetDoctorId) {
    return NextResponse.json({ error: "معرف الطبيب مفقود" }, { status: 400 });
  }

  const whereClause: any = { doctorId: targetDoctorId };
  if (statusFilter) whereClause.handoffStatus = statusFilter;

  const conversations = await db.conversation.findMany({
    where: whereClause,
    include: {
      patient: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ conversations });
}
