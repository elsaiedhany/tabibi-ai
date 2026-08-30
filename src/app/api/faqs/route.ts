import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateApiRequest, isDoctorAccessAllowed } from "@/lib/auth";
import { normalizeText } from "@/lib/arabic";
import { Role } from "@/types/index";

export async function GET(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const paramDoctorId = searchParams.get("doctorId");
  let targetDoctorId = session!.doctorId;

  if (paramDoctorId && session!.role === Role.SUPER_ADMIN) {
    targetDoctorId = paramDoctorId;
  } else if (paramDoctorId && paramDoctorId !== session!.doctorId) {
    return NextResponse.json({ error: "غير مصرح بالوصول لأسئلة طبيب آخر" }, { status: 403 });
  }

  const faqs = await db.faqEntry.findMany({
    where: { doctorId: targetDoctorId! },
    orderBy: { hitCount: "desc" },
  });

  return NextResponse.json({ faqs });
}

export async function POST(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  const body = await req.json();
  const { question, answer, category, doctorId } = body;
  const targetDoctorId = doctorId || session!.doctorId;

  if (!isDoctorAccessAllowed(session!, targetDoctorId)) {
    return NextResponse.json({ error: "غير مصرح بإضافة أسئلة لهذا الطبيب" }, { status: 403 });
  }

  const normalizedQ = normalizeText(question);

  const faq = await db.faqEntry.create({
    data: {
      doctorId: targetDoctorId,
      question,
      normalizedQ,
      answer,
      category,
    },
  });

  return NextResponse.json({ success: true, faq });
}

export async function DELETE(req: NextRequest) {
  const { session, errorResponse } = await authenticateApiRequest(req);
  if (errorResponse) return errorResponse;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "المعرف مفقود" }, { status: 400 });

  const faq = await db.faqEntry.findUnique({ where: { id } });
  if (!faq) return NextResponse.json({ error: "السؤال غير موجود" }, { status: 404 });

  if (!isDoctorAccessAllowed(session!, faq.doctorId)) {
    return NextResponse.json({ error: "غير مصرح بحذف أسئلة طبيب آخر" }, { status: 403 });
  }

  await db.faqEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
