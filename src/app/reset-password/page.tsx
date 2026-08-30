"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Real-time password requirement checks
  const isMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z\u0600-\u06FF]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const isMatching = newPassword === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("رابط إعادة تعيين كلمة المرور غير صالح أو مفقود");
      return;
    }

    if (!isMinLength || !hasLetter || !hasNumber) {
      setError("يرجى التأكد من استيفاء جميع شروط كلمة المرور");
      return;
    }

    if (!isMatching) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(data.message || "تم تحديث كلمة المرور بنجاح.");
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(data.error || "فشل إعادة تعيين كلمة المرور");
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال بالسيرفر. يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#0f172a]/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-2xl">
      <div className="space-y-2 text-center">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mx-auto mb-3 font-bold">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-white">إعادة تعيين كلمة المرور</h1>
        <p className="text-slate-400 text-xs leading-relaxed">
          أدخل كلمة المرور الجديدة لحسابك واحرص على اختيار كلمة مرور قوية وآمنة.
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
          <div>
            <p>{message}</p>
            <p className="text-[11px] text-emerald-300 font-normal mt-1">جاري توجيهك لصفحة الدخول خلال ثوانٍ...</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">كلمة المرور الجديدة *</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-10 py-2.5 text-white text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dir-ltr text-right"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1.5">تأكيد كلمة المرور الجديدة *</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-white text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all dir-ltr text-right"
            />
          </div>
        </div>

        {/* Password Criteria Checklist */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-[11px]">
          <p className="font-bold text-slate-400 text-xs mb-1">متطلبات كلمة المرور:</p>
          <div className={`flex items-center gap-2 ${isMinLength ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
            <span>{isMinLength ? "✓" : "○"}</span>
            <span>8 أحرف على الأقل</span>
          </div>
          <div className={`flex items-center gap-2 ${hasLetter && hasNumber ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
            <span>{hasLetter && hasNumber ? "✓" : "○"}</span>
            <span>تحتوي على أحرف وأرقام معاً</span>
          </div>
          <div className={`flex items-center gap-2 ${isMatching ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
            <span>{isMatching ? "✓" : "○"}</span>
            <span>تطابق كلمتي المرور</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !isMinLength || !hasLetter || !hasNumber || !isMatching}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-extrabold text-sm shadow-xl shadow-brand-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? "جاري التحديث..." : "حفظ كلمة المرور الجديدة"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0b132b] text-slate-100 flex items-center justify-center p-4 dir-rtl">
      <Suspense fallback={<div className="text-white text-sm">جاري التحميل...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
