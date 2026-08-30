"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Sparkles, Plus, Trash2, Tag, Clock } from "lucide-react";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");

  const fetchServices = async () => {
    const res = await fetch("/api/services");
    const data = await res.json();
    if (data.services) setServices(data.services);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, price, durationMinutes }),
    });
    setName("");
    setDescription("");
    setPrice("");
    setShowAdd(false);
    fetchServices();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/services?id=${id}`, { method: "DELETE" });
    fetchServices();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white">الخدمات والأسعار</h1>
            <p className="text-slate-400 text-sm">قائمة الكشوفات والجلسات المتاحة للحجز التلقائي بأسعار EGP</p>
          </div>

          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة خدمة جديدة</span>
          </button>
        </div>

        {showAdd && (
          <form onSubmit={handleCreate} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 max-w-2xl">
            <h3 className="font-bold text-white text-base">إضافة خدمة / كشف جديد</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الخدمة</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: كشف جلدية وتجميل"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">السعر (ج.م)</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="300"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الوصف</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="فحص كامل للبشرة..."
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
              >
                حفظ الخدمة
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((srv) => (
            <div key={srv.id} className="glass-panel p-5 rounded-2xl border border-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-base">{srv.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{srv.description}</p>
                </div>
                <button
                  onClick={() => handleDelete(srv.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-lg font-black text-emerald-400">{srv.price} ج.م</span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>{srv.durationMinutes} دقيقة</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
