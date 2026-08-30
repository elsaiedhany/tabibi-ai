"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import {
  ShieldCheck,
  Stethoscope,
  Smartphone,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Users,
  Activity,
} from "lucide-react";

export default function AdminDashboardPage() {
  const [healthData, setHealthData] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [hRes, dRes] = await Promise.all([
        fetch("/api/health"),
        fetch("/api/doctors"),
      ]);

      const hData = await hRes.json();
      const dData = await dRes.json();

      if (hData) setHealthData(hData);
      if (dData.doctors) setDoctors(dData.doctors);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-brand-400" />
              <span>لوحة إدارة النظام العام (Super Admin)</span>
            </h1>
            <p className="text-slate-400 text-xs mt-1">مراقبة خوادم المنصة، الأطباء النشطين، استهلاك الـ AI، وحالة الواتساب</p>
          </div>

          <button
            onClick={fetchAdminData}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>تحديث الفحص</span>
          </button>
        </div>

        {/* System Monitoring Alerts Banner */}
        {healthData && healthData.systemAlerts && healthData.systemAlerts.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
            <h3 className="text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>تنبيهات النظام الحالية:</span>
            </h3>
            <ul className="text-xs space-y-1 list-disc list-inside text-amber-200">
              {healthData.systemAlerts.map((alert: string, idx: number) => (
                <li key={idx}>{alert}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Pending Registration Applications Quick Action Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-950 via-slate-900 to-teal-950 border border-brand-500/30 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm">طلبات اشتراك الأطباء والعيادات الجديدة</h3>
              <p className="text-slate-300 text-xs mt-0.5">مراجعة طلبات التسجيل، تحديد الباقة (STARTER / PRO / ENTERPRISE)، واعتماد التفعيل.</p>
            </div>
          </div>

          <Link
            href="/admin/applications"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-brand-600/20 flex items-center gap-2 shrink-0"
          >
            <span>مراجعة الطلبات ←</span>
          </Link>
        </div>

        {/* Monitoring KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs text-slate-400 font-bold block">الأطباء النشطين بالنظام</span>
            <div className="text-3xl font-black text-white">{healthData?.metrics?.activeDoctorsCount || doctors.length}</div>
            <span className="text-[11px] text-teal-400 font-semibold block">حسابات عيادات مفعلة</span>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs text-slate-400 font-bold block">حجوزات اليوم بالمنصة</span>
            <div className="text-3xl font-black text-brand-400">{healthData?.metrics?.todayAppointmentsCount || 0}</div>
            <span className="text-[11px] text-slate-400 block">في كل العيادات المسجلة</span>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs text-slate-400 font-bold block">تكلفة الـ AI الإجمالية</span>
            <div className="text-3xl font-black text-emerald-400 font-mono">${healthData?.aiCosts?.estimatedCostUsd || "0.00"}</div>
            <span className="text-[11px] text-emerald-300 font-semibold block">نموذج gpt-4o-mini التكيفي</span>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs text-slate-400 font-bold block">حالة خادم البيانات</span>
            <div className="text-3xl font-black text-teal-300 flex items-center gap-2">
              <Activity className="w-6 h-6 text-teal-400" />
              <span>100% OK</span>
            </div>
            <span className="text-[11px] text-slate-400 block">اتصال قاعدة البيانات مستقر</span>
          </div>
        </div>

        {/* Doctors Directory Table */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-400" />
              <span>عيادات وأطباء النظام المسجلين</span>
            </h2>

            <Link href="/doctors" className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs">
              + إضافة طبيب جديد
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 p-4">
              <div className="h-12 bg-slate-800/40 rounded-xl animate-pulse" />
              <div className="h-12 bg-slate-800/40 rounded-xl animate-pulse" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-900/80 text-slate-400 text-xs font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-4">اسم الطبيب</th>
                    <th className="p-4">التخصص</th>
                    <th className="p-4">رقم الواتساب</th>
                    <th className="p-4">سعر الكشف</th>
                    <th className="p-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {doctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-white">{doc.name}</td>
                      <td className="p-4 text-slate-300">{doc.specialty}</td>
                      <td className="p-4 font-mono text-teal-300 dir-ltr text-right text-xs">{doc.whatsappNumber}</td>
                      <td className="p-4 font-bold text-emerald-400">{doc.consultationPrice} ج.م</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                          نشط
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
