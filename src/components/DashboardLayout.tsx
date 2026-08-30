"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Smartphone,
  Calendar,
  Users,
  Stethoscope,
  Sparkles,
  HelpCircle,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldAlert,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const allNavItems = [
    { label: "لوحة تحكم الطبيب", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "DOCTOR", "STAFF"] },
    { label: "مساعد الواتساب (المحاكي)", href: "/simulator", icon: Smartphone, badge: "مباشر", roles: ["SUPER_ADMIN", "DOCTOR"] },
    { label: "محادثات المرضى", href: "/conversations", icon: MessageSquare, roles: ["SUPER_ADMIN", "DOCTOR", "STAFF"] },
    { label: "جدول المواعيد", href: "/appointments", icon: Calendar, roles: ["SUPER_ADMIN", "DOCTOR", "STAFF"] },
    { label: "سجل المرضى", href: "/patients", icon: Users, roles: ["SUPER_ADMIN", "DOCTOR", "STAFF"] },
    { label: "إدارة الأطباء والحسابات", href: "/doctors", icon: Stethoscope, roles: ["SUPER_ADMIN"] },
    { label: "الخدمات والأسعار", href: "/services", icon: Sparkles, roles: ["SUPER_ADMIN", "DOCTOR"] },
    { label: "الأسئلة الشائعة الـ FAQ", href: "/faqs", icon: HelpCircle, roles: ["SUPER_ADMIN", "DOCTOR"] },
    { label: "التذكيرات الآلية", href: "/reminders", icon: Bell, roles: ["SUPER_ADMIN", "DOCTOR"] },
    { label: "التحليلات وتكلفة الـ AI", href: "/analytics", icon: BarChart3, roles: ["SUPER_ADMIN", "DOCTOR"] },
    { label: "إعدادات العيادة ومساعد الـ AI", href: "/settings", icon: Settings, roles: ["SUPER_ADMIN", "DOCTOR"] },
  ];

  // Filter navigation items based on active user role
  const navItems = allNavItems.filter((item) => {
    if (!user?.role) return true;
    return item.roles.includes(user.role);
  });

  return (
    <div className="min-h-screen flex bg-[#0b132b] text-slate-100">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 border-l border-slate-800 bg-[#0f172a]/90 backdrop-blur-xl p-4 shrink-0">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-3 border-b border-slate-800 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center shadow-lg shadow-brand-500/20 font-bold text-white text-xl">
            ط
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white tracking-wide">طبيبي AI</h1>
            <p className="text-xs text-brand-400 font-medium">نظام استقبال العيادات الذكي</p>
          </div>
        </div>

        {/* Current Active Doctor / User Info Card */}
        <div className="mb-6 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-sm shrink-0">
            {user?.doctorName?.[0] || user?.name?.[0] || "د"}
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-400">
              {user?.role === "SUPER_ADMIN" ? "مدير النظام العام" : user?.role === "STAFF" ? "موظف الاستقبال" : "حساب الطبيب الحالي"}
            </p>
            <p className="text-xs font-bold text-white truncate">{user?.doctorName || user?.name || "د. أحمد محمد"}</p>
            <span className="text-[9px] font-bold text-brand-400 block truncate">
              {user?.role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "مساعد الواتساب (مريم)"}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-brand-600 to-teal-600 text-white shadow-md shadow-brand-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-400/20 text-teal-300 border border-teal-500/30 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="pt-4 border-t border-slate-800 mt-auto flex items-center justify-between px-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-teal-300 text-sm">
              {user?.name?.[0] || "ط"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user?.name || "دكتور"}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.role || "DOCTOR"}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="تسجيل الخروج"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 bg-[#0f172a]/70 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span className="font-semibold text-slate-300">مساعد الواتساب الشخصي متصل بـ 100% عزل للبيانات</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user?.role !== "STAFF" && (
              <Link
                href="/simulator"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 hover:bg-teal-500/20 text-xs font-semibold transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                <span>تجربة مساعد الطبيب</span>
              </Link>
            )}

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            <div className="text-left font-mono text-xs text-slate-400">
              <span className="text-emerald-400 font-bold">طبيبي AI</span> ({user?.role || "DOCTOR"})
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="relative flex-1 max-w-xs bg-[#0f172a] p-4 flex flex-col border-l border-slate-800 z-50">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center font-bold text-white">
                    ط
                  </div>
                  <span className="font-bold text-white">طبيبي AI</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="space-y-1 flex-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium ${
                        isActive
                          ? "bg-brand-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={handleLogout}
                className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 bg-rose-500/10 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
