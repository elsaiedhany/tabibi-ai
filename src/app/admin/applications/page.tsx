"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import {
  ShieldCheck,
  Stethoscope,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Filter,
  RefreshCw,
  Search,
} from "lucide-react";

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const url = filter ? `/api/admin/applications?status=${filter}` : "/api/admin/applications";
      const res = await fetch(url);
      const data = await res.json();
      if (data.applications) setApplications(data.applications);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-brand-400" />
              <span>طلبات اشتراك الأطباء والعيادات</span>
            </h1>
            <p className="text-slate-400 text-xs mt-1">مراجعة بيانات العيادات المقدمة، اختيار باقة الاشتراك، والموافقة أو الرفض</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("PENDING")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === "PENDING"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              بانتظار المراجعة (PENDING)
            </button>
            <button
              onClick={() => setFilter("APPROVED")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === "APPROVED"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              المقبولة (APPROVED)
            </button>
            <button
              onClick={() => setFilter("REJECTED")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === "REJECTED"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              المرفوضة (REJECTED)
            </button>
          </div>
        </div>

        {/* Applications Table */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-400" />
              <span>قائمة طلبات الاشتراك السارية ({applications.length})</span>
            </h2>

            <button onClick={fetchApplications} className="p-2 rounded-lg text-slate-400 hover:text-white">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3 p-4">
              <div className="h-12 bg-slate-800/40 rounded-xl animate-pulse" />
              <div className="h-12 bg-slate-800/40 rounded-xl animate-pulse" />
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-slate-500 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-sm">لا توجد طلبات في هذه الحالة</h3>
              <p className="text-xs text-slate-400">ستظهر طلبات التسجيل الجديدة هنا فور إكمال الأطباء لخطوات الإعداد.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-900/80 text-slate-400 text-xs font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-4">اسم الطبيب</th>
                    <th className="p-4">البريد الإلكتروني</th>
                    <th className="p-4">تاريخ التقديم</th>
                    <th className="p-4">حالة الطلب</th>
                    <th className="p-4">إجراء المراجعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-white">{app.user?.name}</td>
                      <td className="p-4 font-mono text-slate-300 dir-ltr text-right text-xs">{app.user?.email}</td>
                      <td className="p-4 text-slate-400 text-xs font-mono">
                        {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString("ar-EG") : "قيد الإعداد"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                            app.status === "APPROVED"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : app.status === "REJECTED"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {app.status === "APPROVED" ? "مقبول ومفعل" : app.status === "REJECTED" ? "مرفوض" : "بانتظار المراجعة"}
                        </span>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/admin/applications/${app.id}`}
                          className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 w-fit"
                        >
                          <Eye className="w-4 h-4" />
                          <span>مراجعة التفاصيل</span>
                        </Link>
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
