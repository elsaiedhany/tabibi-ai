import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "../types/index";
import { db } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "tabibi_super_secret_jwt_key_egyptian_clinic_2026"
);

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: Role;
  status: "ACTIVE" | "SUSPENDED" | "DISABLED";
  doctorId?: string;
  doctorName?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: UserSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const session = verified.payload as unknown as UserSession;

    // Verify account status directly against DB to catch real-time account suspensions
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { status: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return null;
    }

    return session;
  } catch (error) {
    return null;
  }
}

export async function getCurrentSession(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("tabibi_session")?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  const hierarchy: Record<Role, number> = {
    SUPER_ADMIN: 3,
    DOCTOR: 2,
    STAFF: 1,
  };
  return hierarchy[userRole] >= hierarchy[requiredRole];
}

/**
 * Server-side security check enforcing authentication and tenant ownership
 */
export async function authenticateApiRequest(req: NextRequest): Promise<{
  session: UserSession | null;
  errorResponse?: NextResponse;
}> {
  const token = req.cookies.get("tabibi_session")?.value;
  if (!token) {
    return {
      session: null,
      errorResponse: NextResponse.json({ error: "غير مصرح — يرجى تسجيل الدخول" }, { status: 401 }),
    };
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return {
      session: null,
      errorResponse: NextResponse.json({ error: "جلسة العمل منتهية أو الحساب غير نشط" }, { status: 401 }),
    };
  }

  return { session };
}

/**
 * Enforces strict IDOR and Tenant Doctor Isolation
 */
export function isDoctorAccessAllowed(session: UserSession, targetDoctorId: string): boolean {
  if (session.role === "SUPER_ADMIN") return true;
  if (!targetDoctorId || !session.doctorId) return false;
  return session.doctorId === targetDoctorId;
}
