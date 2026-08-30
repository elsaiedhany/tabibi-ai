import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session!.userId,
      email: session!.email,
      name: session!.name,
      role: session!.role,
      status: session!.status,
      doctorId: session!.doctorId,
      doctorName: session!.doctorName,
    },
  });
}
