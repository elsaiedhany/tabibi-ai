"use client";

import React, { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import {
  MessageSquare,
  Calendar,
  AlertTriangle,
  Zap,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  UserCheck,
  CheckCircle2,
  Clock,
  Smartphone,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [doctor, setDoctor] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics").then((r) => r.json()),
      fetch("/api/appointments").then((r) => r.json()),
      fetch("/api/conversations").then((r) => r.json()),
      fetch("/api/doctors").then((r) => r.json()),
    ])
      .then(([analyticsData, appData, convData, docData]) => {
        setSummary(analyticsData.summary);
        setAppointments(appData.appointments || []);
        setConversations(convData.conversations || []);
        setDoctor(docData.doctor);
      })
      .catch(console.error);
  }, []);

  const pendingEscalations = conversations.filter((c) => c.handoffStatus === "HUMAN_ACTIVE");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              لوحة تحكم مساعد {doctor?.name || "الطبيب"}
            </h1>
            <p className="text-slate-400 text-sm">
              متابعة استجابة الـ AI على الواتساب، المواعيد المؤكدة، والتكلفة الموفرة
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/simulator"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all"
            >
              <Smartphone className="w-4 h-4" />
              <span>فتح محاكي الواتساب</span>
            </Link>
          </div>
        </div>

        {/* Active Escalation Alert Banner */}
        {pendingEscalations.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-amber-300 text-sm">تنبيه: {pendingEscalations.length} محادثة تطلب تدخلاً من مساعد الاستقبال!</h3>
                <p className="text-xs text-amber-200/80">طلب المريض التحدث مباشرة لمساعد العيادة أو استدعى أسلوب متابعة يدوي.</p>
              </div>
            </div>

            <Link
              href="/conversations?status=HUMAN_ACTIVE"
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shrink-0 transition-colors"
            >
              متابعة المحادثات
            </Link>
          </div>
        )}

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">محادثات المرضى</span>
              <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white">{summary?.conversationsCount || 0}</div>
              <p className="text-[11px] text-slate-400 mt-1">محادثات معزولة بالكامل للطبيب</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">الحجوزات المؤكدة</span>
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white">{summary?.appointmentsBooked || 0}</div>
              <p className="text-[11px] text-slate-400 mt-1">سعر الكشف: {doctor?.consultationPrice || 500} ج.م</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">الأتمتة بدون AI</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-emerald-400">{summary?.automationRate || 80}%</div>
              <p className="text-[11px] text-slate-400 mt-1">معالجة كود ثنائية الأبعاد مجانية</p>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">التكلفة الموفرة من الـ AI</span>
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-cyan-300">
                ${summary?.estimatedMoneySavedUsd || "14.50"}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">توفير {summary?.aiCallsAvoided || 45} طلب AI كامل</p>
            </div>
          </div>
        </div>

        {/* Middle Section: Appointments & AI Engine Efficiency */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-white text-base">جدول مواعيد اليوم مع {doctor?.name}</h3>
                <p className="text-xs text-slate-400">قائمة المرضى المسجلين عبر مساعد الواتساب</p>
              </div>

              <Link
                href="/appointments"
                className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                <span>عرض الكل</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {appointments.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">لا توجد حجوزات مسجلة لليوم</div>
              ) : (
                appointments.slice(0, 5).map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-950/80 border border-brand-500/30 flex items-center justify-center font-bold text-brand-300 text-sm">
                        {app.patient?.name?.[0] || "م"}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{app.patient?.name}</h4>
                        <p className="text-xs text-slate-400">
                          {app.service?.name} ({app.service?.price} ج.م)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-left font-mono">
                        <span className="text-xs font-bold text-teal-400 block">{app.time}</span>
                        <span className="text-[10px] text-slate-500">{app.date}</span>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          app.status === "SCHEDULED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : app.status === "CANCELLED"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {app.status === "SCHEDULED" ? "مؤكد" : app.status === "CANCELLED" ? "ملغي" : "معدل"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="font-extrabold text-white text-base mb-1">كفاءة معالجة الرسائل</h3>
              <p className="text-xs text-slate-400 mb-6">مبدأ "CODE FIRST, AI LAST"</p>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                    <span className="text-slate-300">قواعد مبرمجة (Rules & State Machine)</span>
                    <span className="text-emerald-400 font-bold">{summary?.ruleHandledRate || 65}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${summary?.ruleHandledRate || 65}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                    <span className="text-slate-300">مطابقة الـ FAQ وقاعدة المعرفة</span>
                    <span className="text-teal-400 font-bold">{summary?.cacheHitRate || 20}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-teal-400 rounded-full"
                      style={{ width: `${summary?.cacheHitRate || 20}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                    <span className="text-slate-300">ذكاء اصطناعي (OpenAI LLM Fallback)</span>
                    <span className="text-amber-400 font-bold">
                      {100 - ((summary?.ruleHandledRate || 65) + (summary?.cacheHitRate || 20))}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{
                        width: `${100 - ((summary?.ruleHandledRate || 65) + (summary?.cacheHitRate || 20))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 p-3 rounded-xl bg-slate-900/60 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-[11px] text-slate-300 leading-relaxed">
                يضمن هذا النظام حماية الطبيب من تكاليف الـ AI المرتفعة مع الرد في غضون ثوانٍ!
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
