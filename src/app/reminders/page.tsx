"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Bell, Send, CheckCircle2, Clock, ShieldCheck } from "lucide-react";

export default function RemindersPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleTriggerReminders = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/reminders", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(`تم إرسال التذكيرات الآلية بنجاح لـ ${data.sentCount} مريض!`);
      }
    } catch (e) {
      setMessage("حدث خطأ في تشغيل التذكيرات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white">التذكيرات الآلية والمتابعة</h1>
            <p className="text-slate-400 text-sm">إعداد وتفعيل رسائل التذكير التلقائية قبل الموعد بـ 24 ساعة و 2 ساعة</p>
          </div>

          <button
            onClick={handleTriggerReminders}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-brand-500/20 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? "جاري الإرسال..." : "تشغيل فحص التذكيرات الآن"}</span>
          </button>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{message}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">تذكير قبل الموعد بـ 24 ساعة</h3>
                  <p className="text-xs text-slate-400">إرسال تفاصيل الموعد وتأكيد الحضور تلقائياً للمريض</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">مفعل</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 text-slate-300 font-mono text-xs border border-slate-800">
              "أهلاً يا {"{patient_name}"}، بنفكرك إن معادك مع {"{doctor_name}"} بكرة الساعة {"{time}"} بالعيادة ({"{service_name}"}). لو حابب تعدل أو تلغي المعاد قولنا! 😊"
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">تذكير قبل الموعد بـ 2 ساعة</h3>
                  <p className="text-xs text-slate-400">تنبيه عاجل لضمان الوصول وتفادي الـ No-show</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">مفعل</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 text-slate-300 font-mono text-xs border border-slate-800">
              "تذكير: معادك بالعيادة بعد ساعتين الساعة {"{time}"}. نتمنى لك الوصول بالسلامة!"
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
