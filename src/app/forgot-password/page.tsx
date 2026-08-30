"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(data.message || "لو البريد الإلكتروني مسجل عندنا، هيوصلك رابط لإعادة تعيين كلمة المرور.");
      } else {
        setError(data.error || "حدث خطأ في تقديم الطلب");
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال بالسيرفر. يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b132b] text-slate-100 flex items-center justify-center p-4 dir-rtl">
      <div className="w-full max-w-md bg-[#0f172a]/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-2xl">
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 flex items-center justify-center mx-auto mb-3 font-bold">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white">استعادة كلمة المرور</h1>
          <p className="text-slate-400 text-xs leading-relaxed">
            أدخل بريدك الإلكتروني المسجل بالنظام وسنرسل لك رابطاً آثمناً لإعادة تعيين كلمة المرور الخاصة بك.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{message}</span>
          </div>
        )}

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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-extrabold text-sm shadow-xl shadow-brand-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800/80 text-center">
          <Link href="/login" className="text-xs font-bold text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-colors">
            <ArrowRight className="w-4 h-4" />
            <span>العودة لصفحة تسجيل الدخول</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
