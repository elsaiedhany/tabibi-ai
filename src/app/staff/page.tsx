"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import {
  Calendar,
  Users,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Printer,
  RefreshCw,
  UserPlus,
} from "lucide-react";

export default function StaffDashboardPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      if (data.appointments) setAppointments(data.appointments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  const filtered = appointments.filter((app) => {
    const isToday = app.date === todayStr;
    const nameMatch = app.patient?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = app.patient?.whatsappNumber?.includes(searchQuery);
    return isToday && (nameMatch || phoneMatch);
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Header & Quick Action Buttons */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">لوحة مكتب الاستقبال</h1>
            <p className="text-slate-400 text-xs mt-1">إدارة حجز المواعيد اليومية، الاستعلام السريع، وحجز الـ Walk-in للمرضى</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/appointments"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-brand-600/20 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ حجز يدوي (Walk-in)</span>
            </Link>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة كشف اليوم</span>
            </button>
          </div>
        </div>

        {/* Live Search Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث سريع عن مريض بالاسم أو رقم الهاتف..."
            className="w-full bg-transparent border-none text-white text-sm focus:outline-none placeholder:text-slate-500"
          />
        </div>

        {/* Today's Schedule Table */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-400" />
              <span>مواعيد كشف اليوم بالعيادة</span>
            </h2>

            <button onClick={fetchAppointments} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3 p-4">
              <div className="h-12 bg-slate-800/40 rounded-xl animate-pulse" />
              <div className="h-12 bg-slate-800/40 rounded-xl animate-pulse" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-slate-500 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-sm">مفيش مواعيد مطابقة للبحث</h3>
              <p className="text-xs text-slate-400">تأكد من اسم المريض أو قم بإضافة حجز يدوي مباشر الآن.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-900/80 text-slate-400 text-xs font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-4">المريض</th>
                    <th className="p-4">الهاتف</th>
                    <th className="p-4">الوقت</th>
                    <th className="p-4">الخدمة والخصم</th>
                    <th className="p-4">حالة الحجز</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-white">{app.patient?.name}</td>
                      <td className="p-4 font-mono text-slate-300 dir-ltr text-right text-xs">{app.patient?.whatsappNumber}</td>
                      <td className="p-4 font-mono font-bold text-brand-400 text-xs">{app.time}</td>
                      <td className="p-4 text-teal-300 font-semibold">{app.service?.name}</td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                            app.status === "SCHEDULED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {app.status === "SCHEDULED" ? "مؤكد" : "ملغي"}
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
