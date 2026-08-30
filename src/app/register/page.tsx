"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, Phone, Eye, EyeOff, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Stethoscope } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z\u0600-\u06FF]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isMatching = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (!isMinLength || !hasLetter || !hasNumber) {
      setError("كلمة المرور يجب أن تتكون من 8 أحرف على الأقل وتجمع بين الحروف والأرقام");
      return;
    }

    if (!isMatching) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    if (!agreed) {
      setError("يرجى الموافقة على الشروط والأحكام للاستمرار");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/onboarding");
      } else {
        setError(data.error || "حدث خطأ أثناء التسجيل");
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال بالسيرفر. يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b132b] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 dir-rtl">
      <div className="w-full max-w-5xl bg-[#0f172a]/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 backdrop-blur-2xl">
        {/* Left Branding Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-brand-950 via-slate-900 to-teal-950 p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-l border-slate-800/80 relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center shadow-lg shadow-brand-500/30 font-extrabold text-white text-2xl">
                ط
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-wide">طبيبي AI</h1>
                <span className="text-xs font-bold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                  انضم لأكثر من 50 عيادة في مصر
                </span>
              </div>
            </div>

            <h2 className="text-xl font-extrabold text-white pt-4">ابدأ مع طبيبي AI</h2>
            <p className="text-slate-300 text-xs leading-relaxed">
              خلّي استقبال عيادتك يشتغل تلقائيًا على WhatsApp. رد على الاستفسارات، حجز مواعيد الكشف، وتذكير المرضى بالعامية المصرية.
            </p>
          </div>

          <div className="relative z-10 my-8 space-y-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>إعداد ملف العيادة والمواعيد خلال 5 دقائق</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>مراجعة وتفعيل الحساب من إدارة النظام</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>عزل تام وبيانات محمية 100% لكل طبيب</span>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-slate-800/60 text-slate-500 text-[11px] flex items-center justify-between">
            <span>عندك حساب بالفعل؟</span>
            <Link href="/login" className="text-brand-400 font-bold hover:text-brand-300">
              تسجيل الدخول ←
            </Link>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
          <div className="space-y-5 max-w-md mx-auto w-full">
            <div>
              <h2 className="text-2xl font-black text-white">إنشاء حساب طبيب جديد</h2>
              <p className="text-slate-400 text-xs mt-1">أدخل بياناتك الأساسية للبدء في خطوة إعداد العيادة</p>
            </div>

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم الطبيب بالكامل *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="د. أحمد محمد السعيد"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-white text-sm focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">البريد الإلكتروني *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doctor@clinic.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-white text-xs focus:border-brand-500 outline-none dir-ltr text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">رقم الموبايل الشخصي *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01012345678"
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-white text-xs focus:border-brand-500 outline-none font-mono dir-ltr text-right"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كلمة المرور *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-10 py-2.5 text-white text-sm focus:border-brand-500 outline-none dir-ltr text-right"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">تأكيد كلمة المرور *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-white text-sm focus:border-brand-500 outline-none dir-ltr text-right"
                  />
                </div>
              </div>

              {/* Password Checklist */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1 text-[11px]">
                <div className={`flex items-center gap-1.5 ${isMinLength ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
                  <span>{isMinLength ? "✓" : "○"}</span>
                  <span>8 أحرف على الأقل</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLetter && hasNumber ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
                  <span>{hasLetter && hasNumber ? "✓" : "○"}</span>
                  <span>تحتوي على أحرف وأرقام معاً</span>
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-brand-500"
                />
                <span>أوافق على شروط الاستخدام وسياسة الخصوصية الخاصة بمنصة طبيبي AI.</span>
              </label>

              <button
                type="submit"
                disabled={loading || !agreed || !isMinLength || !hasLetter || !hasNumber || !isMatching}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-extrabold text-sm shadow-xl shadow-brand-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "جاري إنشاء الحساب..." : "الاستمرار لإعداد العيادة ←"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
