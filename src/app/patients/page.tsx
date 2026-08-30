"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import { Users, Phone, Calendar, Search, UserPlus, FileText, MessageSquare, X, ArrowLeft } from "lucide-react";

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((d) => {
        if (d.conversations) {
          const list = d.conversations.map((c: any) => ({
            id: c.patient?.id,
            conversationId: c.id,
            name: c.patient?.name || "مريض بدون اسم",
            phone: c.patient?.whatsappNumber,
            notes: c.patient?.notes || "مريض مسجل عبر الواتساب",
            appointments: c.patient?.appointments || [],
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
            <p className="text-slate-400 text-sm">البحث السريع باسم المريض أو رقم الموبايل وعرض ملف التاريخ الطبي</p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم المريض أو رقم الموبايل..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-4 py-2 text-white text-sm focus:border-brand-500 outline-none"
            />
          </div>
        </div>

        {/* Patient Table */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">
              <div className="h-10 bg-slate-800/40 rounded-xl animate-pulse" />
              <div className="h-10 bg-slate-800/40 rounded-xl animate-pulse" />
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-slate-500 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-sm">لا يوجد مرضى مطابقين للبحث</h3>
              <p className="text-xs text-slate-400">تأكد من رقم الموبايل أو اسم المريض المكتوب في مربع البحث.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-900/80 text-slate-400 text-xs font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-4">اسم المريض</th>
                    <th className="p-4">رقم الواتساب</th>
                    <th className="p-4">ملاحظات الملف</th>
                    <th className="p-4">آخر تفاعل بالعيادة</th>
                    <th className="p-4">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPatients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-white flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-950 text-brand-300 font-bold flex items-center justify-center text-xs border border-brand-800">
                          {p.name[0]}
                        </div>
                        <span>{p.name}</span>
                      </td>
                      <td className="p-4 font-mono text-slate-300 dir-ltr text-right">{p.phone}</td>
                      <td className="p-4 text-slate-400 text-xs">{p.notes}</td>
                      <td className="p-4 text-slate-400 text-xs font-mono">{new Date(p.updatedAt).toLocaleDateString("ar-EG")}</td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedPatient(p)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-teal-400" />
                          <span>عرض الملف الكامل</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Patient Profile Drawer / Modal */}
        {selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm dir-rtl">
            <div className="w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 text-white font-extrabold flex items-center justify-center text-lg shadow-lg">
                    {selectedPatient.name[0]}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">{selectedPatient.name}</h3>
                    <p className="text-xs font-mono text-teal-400 dir-ltr text-right">{selectedPatient.phone}</p>
                  </div>
                </div>

                <button onClick={() => setSelectedPatient(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Patient Details Cards */}
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 font-semibold block">ملاحظات وحالة المريض</span>
                  <p className="text-xs text-slate-200">{selectedPatient.notes}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400 font-semibold block">تاريخ التسجيل بالتاريخ والوقت</span>
                  <p className="text-xs text-teal-300 font-mono">
                    {new Date(selectedPatient.updatedAt).toLocaleString("ar-EG")}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <Link
                  href={`/conversations?id=${selectedPatient.conversationId}`}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>فتح محادثة الواتساب</span>
                </Link>

                <button
                  onClick={() => setSelectedPatient(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold text-xs"
                >
                  إغلاق الملف
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
