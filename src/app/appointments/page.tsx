"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Calendar, Plus, CheckCircle, XCircle, Clock, Filter, User, Printer, CalendarDays, ListFilter, Phone, FileText } from "lucide-react";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [viewMode, setViewMode] = useState<"TABLE" | "CALENDAR">("TABLE");

  // Modal State for Walk-In Booking
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    patientPhone: "",
    serviceId: "",
    date: new Date().toISOString().split("T")[0],
    time: "17:00",
    notes: "حجز يدوي عن طريق الاستقبال (Walk-in)",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = async () => {
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

  const fetchServices = async () => {
    try {
      const res = await fetch("/api/services");
      const data = await res.json();
      if (data.services) setServices(data.services);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchServices();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    await fetch("/api/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: id, status: newStatus }),
    });
    fetchAppointments();
  };

  const handleCreateWalkInAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientName || !formData.patientPhone) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          patientName: "",
          patientPhone: "",
          serviceId: "",
          date: new Date().toISOString().split("T")[0],
          time: "17:00",
          notes: "حجز يدوي عن طريق الاستقبال (Walk-in)",
        });
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintDailySchedule = () => {
    window.print();
  };

  const filtered = appointments.filter((a) => {
    if (filterStatus === "ALL") return true;
    return a.status === filterStatus;
  });

  const timeSlots = ["16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header & Action Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-2xl font-extrabold text-white">جدول مواعيد العيادة</h1>
            <p className="text-slate-400 text-sm">إدارة الحجوزات، المواعيد الصوتية، والحجوزات المباشرة (Walk-in)</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle */}
            <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
              <button
                onClick={() => setViewMode("TABLE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  viewMode === "TABLE" ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>قائمة</span>
              </button>
              <button
                onClick={() => setViewMode("CALENDAR")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  viewMode === "CALENDAR" ? "bg-brand-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>جدول زمني</span>
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrintDailySchedule}
              className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold hover:bg-slate-700 transition-colors flex items-center gap-2 border border-slate-700"
            >
              <Printer className="w-4 h-4 text-brand-400" />
              <span>طباعة الكشف</span>
            </button>

            {/* Walk-In Manual Booking Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-extrabold hover:bg-brand-500 transition-all flex items-center gap-2 shadow-lg shadow-brand-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>+ حجز يدوي مباشر (Walk-in)</span>
            </button>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 print:hidden">
          {["ALL", "SCHEDULED", "COMPLETED", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filterStatus === st ? "bg-brand-600 text-white shadow-md shadow-brand-600/20" : "bg-slate-800/80 text-slate-400 hover:text-white"
              }`}
            >
              {st === "ALL" ? "كل المواعيد" : st === "SCHEDULED" ? "مؤكد" : st === "COMPLETED" ? "مكتمل" : "ملغي"}
            </button>
          ))}
        </div>

        {/* VIEW MODE 1: TABLE VIEW */}
        {viewMode === "TABLE" && (
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-900/80 text-slate-400 text-xs font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-4">اسم المريض</th>
                    <th className="p-4">اسم الطبيب</th>
                    <th className="p-4">الخدمة والفيزيتة</th>
                    <th className="p-4">التاريخ والوقت</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4 text-center print:hidden">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filtered.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-white flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-950 text-brand-300 font-bold flex items-center justify-center text-xs border border-brand-800">
                          {app.patient?.name?.[0]}
                        </div>
                        <div>
                          <span>{app.patient?.name}</span>
                          <span className="block text-[11px] text-slate-400 font-normal dir-ltr text-right">
                            {app.patient?.whatsappNumber}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-slate-300 font-semibold">{app.doctor?.name}</td>
                      <td className="p-4 text-teal-300 font-semibold">
                        {app.service?.name} ({app.service?.price || app.doctor?.consultationPrice} ج.م)
                      </td>
                      <td className="p-4 font-mono text-slate-200">
                        <div>{app.date}</div>
                        <div className="text-xs text-brand-400 font-bold">{app.time}</div>
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

                      <td className="p-4 text-center print:hidden">
                        <div className="flex items-center justify-center gap-2">
                          {app.status === "SCHEDULED" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(app.id, "COMPLETED")}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 border border-emerald-500/30"
                              >
                                إكمال
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(app.id, "CANCELLED")}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-bold hover:bg-rose-500/30 border border-rose-500/30"
                              >
                                إلغاء
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: VISUAL TIME SLOTS CALENDAR */}
        {viewMode === "CALENDAR" && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-brand-400" />
              <span>الجدول الزمني التفاعلي ليوم اليوم</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {timeSlots.map((slotTime) => {
                const appInSlot = appointments.find((a) => a.time === slotTime && a.status === "SCHEDULED");
                return (
                  <div
                    key={slotTime}
                    className={`p-4 rounded-xl border transition-all ${
                      appInSlot
                        ? "bg-brand-950/40 border-brand-600/50 shadow-md"
                        : "bg-slate-900/40 border-slate-800 text-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-sm font-bold text-brand-300 mb-2">
                      <span>{slotTime}</span>
                      {appInSlot ? (
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          محجوز
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-sans font-normal">متاح</span>
                      )}
                    </div>

                    {appInSlot ? (
                      <div className="space-y-1">
                        <div className="font-bold text-white">{appInSlot.patient?.name}</div>
                        <div className="text-xs text-teal-400 font-semibold">{appInSlot.service?.name}</div>
                        <div className="text-[11px] text-slate-400 dir-ltr text-right">{appInSlot.patient?.whatsappNumber}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">لا يوجد حجز مسجل في هذا الموعد</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WALK-IN MANUAL BOOKING MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-brand-400" />
                  <span>تسجيل حجز يدوي مباشر (Walk-in)</span>
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateWalkInAppointment} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">اسم المريض الثلاثي *</label>
                  <input
                    type="text"
                    required
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-brand-500 outline-none"
                    placeholder="مثال: محمد أحمد محمود"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">رقم الواتساب *</label>
                  <input
                    type="text"
                    required
                    value={formData.patientPhone}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-brand-500 outline-none dir-ltr text-right"
                    placeholder="2010XXXXXXXX"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">التاريخ *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-brand-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">الوقت *</label>
                    <select
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-brand-500 outline-none"
                    >
                      {timeSlots.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {services.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">الخدمة المطلوب حجزها</label>
                    <select
                      value={formData.serviceId}
                      onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm focus:border-brand-500 outline-none"
                    >
                      <option value="">كشف رئيسي افتراضي</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.price} ج.م)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-500 shadow-md shadow-brand-600/20"
                  >
                    {submitting ? "جاري الحفظ..." : "حفظ الموعد"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
