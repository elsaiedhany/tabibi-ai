import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "tabibi_super_secret_jwt_key_egyptian_clinic_2026"
);

const protectedRoutes = [
  "/admin",
  "/doctor",
  "/staff",
  "/dashboard",
  "/simulator",
  "/conversations",
  "/appointments",
  "/doctors",
  "/services",
  "/patients",
  "/faqs",
  "/reminders",
  "/analytics",
  "/settings",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    const token = req.cookies.get("tabibi_session")?.value;

    if (!token) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      const payload = verified.payload as any;
      const userRole = payload?.role;

      // 1. Redirect legacy /dashboard to role home
      if (pathname === "/dashboard") {
        if (userRole === "SUPER_ADMIN") return NextResponse.redirect(new URL("/admin", req.url));
        if (userRole === "STAFF") return NextResponse.redirect(new URL("/staff", req.url));
        return NextResponse.redirect(new URL("/doctor", req.url));
      }

      // 2. Strict Role Route Enforcements
      if (pathname.startsWith("/admin") && userRole !== "SUPER_ADMIN") {
        const homeUrl = userRole === "STAFF" ? "/staff" : "/doctor";
        return NextResponse.redirect(new URL(homeUrl, req.url));
      }

      if (pathname.startsWith("/doctor") && userRole === "STAFF") {
        return NextResponse.redirect(new URL("/staff", req.url));
      }

      return NextResponse.next();
    } catch (err) {
      const loginUrl = new URL("/login", req.url);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete("tabibi_session");
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/doctor/:path*",
    "/staff/:path*",
    "/dashboard/:path*",
    "/simulator/:path*",
    "/conversations/:path*",
    "/appointments/:path*",
    "/doctors/:path*",
    "/services/:path*",
    "/patients/:path*",
    "/faqs/:path*",
    "/reminders/:path*",
    "/analytics/:path*",
    "/settings/:path*",
  ],
};
