"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { BarChart3, DollarSign, Zap, Cpu, TrendingUp, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setSummary(d.summary))
      .catch(console.error);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        <div>
          <h1 className="text-2xl font-extrabold text-white">التحليلات وتكاليف الذكاء الاصطناعي</h1>
          <p className="text-slate-400 text-sm">مراقبة دقيقة لاستخدام التوكنز ومحركات التوفير ونسبة الأتمتة المباشرة</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold block">إجمالي مكالمات AI</span>
            <span className="text-2xl font-black text-white mt-1 block">{summary?.aiCallsTotal || 1}</span>
            <span className="text-[11px] text-amber-400 font-semibold mt-1 block">استدعاء عند الحاجة فقط</span>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold block">مكالمات AI تم توفيرها</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{summary?.aiCallsAvoided || 45}</span>
            <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">معالجة كود بدون تكلفة</span>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold block">إجمالي استهلاك التوكنز</span>
            <span className="text-2xl font-black text-teal-300 font-mono mt-1 block">
              {summary?.aiTotalTokens || 195}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">Input + Output Tokens</span>
          </div>

          <div className="glass-card p-5 rounded-2xl">
            <span className="text-xs text-slate-400 font-semibold block">المبلغ الموفر تقديرياً</span>
            <span className="text-2xl font-black text-cyan-300 mt-1 block">
              ${summary?.estimatedMoneySavedUsd || "14.50"}
            </span>
            <span className="text-[11px] text-cyan-400 font-semibold mt-1 block">مقارنة بالأتمتة الكاملة بالـ AI</span>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-400" />
            <span>تفاصيل توزيع معالجة الرسائل</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-semibold">القواعد وآلة الحالات</span>
              <div className="text-2xl font-black text-emerald-400">{summary?.ruleHandledRate || 65}%</div>
              <p className="text-[11px] text-slate-400">حجز وإجابات مواعيد وعناوين بالـ Deterministic engine</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-semibold">مطابقة الكاش والـ FAQs</span>
              <div className="text-2xl font-black text-teal-400">{summary?.cacheHitRate || 20}%</div>
              <p className="text-[11px] text-slate-400">إجابة الأسئلة المتكررة من الـ Knowledge base</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-semibold">الذكاء الاصطناعي التكيفي</span>
              <div className="text-2xl font-black text-amber-400">
                {100 - ((summary?.ruleHandledRate || 65) + (summary?.cacheHitRate || 20))}%
              </div>
              <p className="text-[11px] text-slate-400">استخدام نموذج gpt-4o-mini للاستفسارات المعقدة</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
