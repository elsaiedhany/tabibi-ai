"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, Phone, Calendar, Search, UserPlus } from "lucide-react";

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => {
        if (d.conversations) {
          const list = d.conversations.map((c: any) => ({
            id: c.patient?.id,
            name: c.patient?.name || "مريض بدون اسم",
            phone: c.patient?.whatsappNumber,
            notes: c.patient?.notes || "مريض مسجل بالواتساب",
            updatedAt: c.updatedAt,
          }));
          setPatients(list);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredPatients = patients.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.phone?.includes(q);
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">سجل وقاعدة بيانات المرضى</h1>
            <p className="text-slate-400 text-sm">البحث السريع بـ الاسم أو رقم الهاتف وإدارة ملفات العيادة</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو رقم الهاتف..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-4 py-2 text-white text-sm focus:border-brand-500 outline-none"
            />
          </div>
        </div>

        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-900/80 text-slate-400 text-xs font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">اسم المريض</th>
                  <th className="p-4">رقم الواتساب</th>
                  <th className="p-4">ملاحظات الملف</th>
                  <th className="p-4">آخر تفاعل بالعيادة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-950 text-brand-300 font-bold flex items-center justify-center text-xs border border-brand-800">
                        {p.name[0]}
                      </div>
                      <span>{p.name}</span>
                    </td>
                    <td className="p-4 font-mono text-slate-300 dir-ltr text-right">{p.phone}</td>
                    <td className="p-4 text-slate-400 text-xs">{p.notes}</td>
                    <td className="p-4 text-slate-400 text-xs font-mono">{new Date(p.updatedAt).toLocaleDateString("ar-EG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
