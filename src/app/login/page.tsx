"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Stethoscope, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"DOCTOR" | "SUPER_ADMIN">("DOCTOR");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, selectedRole }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(data.redirectTo || "/dashboard");
      } else {
        setError(data.error || "بيانات الدخول غير صحيحة");
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال بالسيرفر. يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b132b] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 dir-rtl">
      {/* Container Box */}
      <div className="w-full max-w-5xl bg-[#0f172a]/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 backdrop-blur-2xl">
        {/* Left/Right Branding Banner (Desktop View) */}
        <div className="lg:col-span-6 bg-gradient-to-br from-brand-950 via-slate-900 to-teal-950 p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-l border-slate-800/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Logo & Product Identity */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center shadow-lg shadow-brand-500/30 font-extrabold text-white text-2xl">
                ط
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-wide">طبيبي AI</h1>
                <span className="text-xs font-bold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                  منصة استقبال العيادات الذكية
                </span>
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed pt-2">
              مساعد الواتساب الذكي المخصص للأطباء والعيادات في مصر. أتمتة الردود، حجز المواعيد، وتذكير المرضى تلقائياً.
            </p>
          </div>

          {/* Value Props Bullet Points */}
          <div className="relative z-10 my-8 space-y-4">
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">استقبال المرضى بالعامية المصرية</h3>
                <p className="text-[11px] text-slate-400">فهم ذكي للاستفسارات بالأسعار والمواعيد دون اختراع.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">عزل تام لبيانات كل عيادة</h3>
                <p className="text-[11px] text-slate-400">حماية فائقة لبيانات المرضى والمواعيد لكل طبيب مستقل.</p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="relative z-10 pt-4 border-t border-slate-800/60 text-slate-500 text-[11px] flex items-center justify-between">
            <span>© 2026 طبيبي AI — جميع الحقوق محفوظة</span>
            <span className="text-emerald-400 font-mono text-[10px]">SaaS v2.4</span>
          </div>
        </div>

        {/* Right/Left Login Form Panel */}
        <div className="lg:col-span-6 p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
          <div className="space-y-6 max-w-sm mx-auto w-full">
            {/* Header Title */}
            <div>
              <h2 className="text-2xl font-black text-white">تسجيل الدخول للنظام</h2>
              <p className="text-slate-400 text-xs mt-1">اختر نوع الحساب وأدخل بيانات الدخول المعتمدة</p>
            </div>

            {/* Error Alert Display */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Account Type Selector Toggle */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">نوع الحساب *</label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setSelectedRole("DOCTOR")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    selectedRole === "DOCTOR"
                      ? "bg-gradient-to-r from-brand-600 to-teal-600 text-white shadow-md shadow-brand-600/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                  <span>دكتور / عيادة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("SUPER_ADMIN")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    selectedRole === "SUPER_ADMIN"
                      ? "bg-gradient-to-r from-brand-600 to-teal-600 text-white shadow-md shadow-brand-600/20"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>إدارة النظام</span>
                </button>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">البريد الإلكتروني *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@clinic.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-white text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dir-ltr text-right"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">كلمة المرور *</label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-bold text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-10 py-2.5 text-white text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dir-ltr text-right"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                    title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-extrabold text-sm shadow-xl shadow-brand-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>جاري التحقق...</span>
                  </span>
                ) : (
                  <>
                    <span>تسجيل الدخول</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </>
                )}
              </button>

              {/* Registration Link */}
              <div className="pt-3 text-center border-t border-slate-800/80">
                <span className="text-xs text-slate-400">لسه معندكش حساب؟ </span>
                <Link href="/register" className="text-xs font-bold text-teal-400 hover:text-teal-300">
                  ابدأ مع طبيبي AI ←
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
