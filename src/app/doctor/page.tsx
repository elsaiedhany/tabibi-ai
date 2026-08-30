"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  MessageSquare,
  Smartphone,
  AlertCircle,
  TrendingUp,
  Plus,
  RefreshCw,
  Search,
  Check,
  X,
  User,
} from "lucide-react";

export default function DoctorDashboardPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [doctorSettings, setDoctorSettings] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [appRes, convRes, setRes, subRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/conversations"),
        fetch("/api/settings"),
        fetch("/api/subscription"),
      ]);

      const appData = await appRes.json();
      const convData = await convRes.json();
      const setData = await setRes.json();
      const subData = await subRes.json();

      if (appData.appointments) setAppointments(appData.appointments);
      if (convData.conversations) setConversations(convData.conversations);
      if (setData.doctor?.settings) setDoctorSettings(setData.doctor.settings);
      if (subData.subscription) setSubscription(subData.subscription);
    } catch (err) {
      setError("حصل خطأ أثناء تحميل بيانات العيادة. اضغط إعادة المحاولة.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter((a) => a.date === todayStr);

  const confirmedToday = todayAppointments.filter((a) => a.status === "SCHEDULED" || a.status === "COMPLETED").length;
  const newBookingsCount = todayAppointments.length;
  const handoffCount = conversations.filter((c) => c.handoffStatus === "HUMAN_ACTIVE").length;

  const isWhatsappConnected = Boolean(doctorSettings?.whatsappAccessToken && doctorSettings?.whatsappPhoneNumberId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">الرئيسية — لوحة الطبيب</h1>
            <p className="text-slate-400 text-xs mt-1">متابعة مواعيد اليوم وحالة المساعد الآلي على الواتساب</p>
          </div>

          <button
            onClick={fetchData}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>تحديث البيانات</span>
          </button>
        </div>

        {/* Error Alert Display */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <span>{error}</span>
            </div>
            <button onClick={fetchData} className="px-3 py-1 bg-rose-500/20 rounded-lg text-rose-200 hover:bg-rose-500/30">
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* Subscription Status Banner */}
        {subscription && subscription.status === "TRIAL" && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>الفترة التجريبية مجانية: متبقي منها {subscription.daysRemaining || 7} أيام (باقة {subscription.plan || "PRO"})</span>
            </div>
            <span className="text-[11px] text-amber-400/80">تتجدد تلقائياً بالتنسيق مع إدارة المنصة</span>
          </div>
        )}

        {subscription && (subscription.status === "EXPIRED" || subscription.status === "SUSPENDED") && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <span>اشتراك العيادة منتهي أو موقوف حالياً. يرجى للتجديد والتفعيل التواصل مع الإدارة.</span>
            </div>
          </div>
        )}

        {/* WhatsApp Connection Banner */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isWhatsappConnected ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">حالة مساعد الواتساب:</span>
                {isWhatsappConnected ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-extrabold border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    متصل ويعمل تلقائياً
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-extrabold border border-rose-500/30">
                    غير متصل — محتاج توكن Meta
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">مساعد الذكاء الاصطناعي (مريم) جاهز للرد على استفسارات المرضى</p>
            </div>
          </div>

          {!isWhatsappConnected && (
            <Link href="/settings" className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20">
              ربط الواتساب الآن
            </Link>
          )}
        </div>

        {/* Real KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>مواعيد النهاردة</span>
              <Calendar className="w-4 h-4 text-brand-400" />
            </div>
            <div className="text-3xl font-black text-white">{todayAppointments.length}</div>
            <p className="text-[11px] text-slate-400">إجمالي حجز اليوم بالعيادة</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>تأكيد الحضور</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400">{confirmedToday}</div>
            <p className="text-[11px] text-emerald-400 font-semibold">مرضى مؤكدة زيارتهم</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>حجوزات جديدة</span>
              <TrendingUp className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-3xl font-black text-teal-300">{newBookingsCount}</div>
            <p className="text-[11px] text-slate-400">سُجلت اليوم من الواتساب والاستقبال</p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
              <span>تحتاج تدخل موظف</span>
              <MessageSquare className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-400">{handoffCount}</div>
            <p className="text-[11px] text-amber-300 font-semibold">محادثات بانتظار رد الاستقبال</p>
          </div>
        </div>

        {/* Today's Schedule Table & Empty State */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-400" />
              <span>جدول مواعيد اليوم بالعيادة</span>
            </h2>

            <Link href="/appointments" className="text-xs font-bold text-brand-400 hover:text-brand-300">
              عرض كل المواعيد ←
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 p-4">
              <div className="h-12 bg-slate-800/40 rounded-xl animate-pulse" />
              <div className="h-12 bg-slate-800/40 rounded-xl animate-pulse" />
              <div className="h-12 bg-slate-800/40 rounded-xl animate-pulse" />
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-slate-500 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-sm">مفيش مواعيد مجهزة النهاردة</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">لما يتم حجز أول موعد عبر الواتساب أو الاستقبال، هيظهر هنا فوراً.</p>
              <Link href="/appointments" className="inline-block px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold">
                + حجز يدوي مباشر (Walk-in)
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-900/80 text-slate-400 text-xs font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-4">اسم المريض</th>
                    <th className="p-4">الوقت</th>
                    <th className="p-4">الخدمة</th>
                    <th className="p-4">مصدر الحجز</th>
                    <th className="p-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {todayAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-white flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-950 text-brand-300 font-bold flex items-center justify-center text-xs border border-brand-800">
                          {app.patient?.name?.[0]}
                        </div>
                        <div>
                          <span>{app.patient?.name}</span>
                          <span className="block text-[11px] text-slate-400 font-normal dir-ltr text-right">{app.patient?.whatsappNumber}</span>
                        </div>
                      </td>

                      <td className="p-4 font-mono font-bold text-brand-400 text-xs">{app.time}</td>
                      <td className="p-4 text-teal-300 font-semibold">{app.service?.name} ({app.service?.price} ج.م)</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-bold border border-slate-700">
                          {app.conversationId ? "واتساب AI" : "حجز يدوي"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                            app.status === "SCHEDULED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : app.status === "CANCELLED"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {app.status === "SCHEDULED" ? "مؤكد" : app.status === "CANCELLED" ? "ملغي" : "مكتمل"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
