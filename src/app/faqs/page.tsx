"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { HelpCircle, Plus, Trash2, Sparkles, Check, ArrowRight } from "lucide-react";

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [aiMessagesToOptimize, setAiMessagesToOptimize] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("GENERAL");

  const fetchFaqs = async () => {
    const res = await fetch("/api/faqs");
    const data = await res.json();
    if (data.faqs) setFaqs(data.faqs);
    if (data.aiMessagesToOptimize) setAiMessagesToOptimize(data.aiMessagesToOptimize);
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/faqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer, category }),
    });
    setQuestion("");
    setAnswer("");
    setShowAdd(false);
    fetchFaqs();
  };

  const handleQuickConvert = (qText: string) => {
    setQuestion(qText);
    setAnswer("");
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/faqs?id=${id}`, { method: "DELETE" });
    fetchFaqs();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white">الأسئلة الشائعة وقاعدة المعرفة</h1>
            <p className="text-slate-400 text-sm">الردود الثابتة المسجلة للرد التلقائي بدقة 100% دون استهلاك للذكاء الاصطناعي</p>
          </div>

          <button
            onClick={() => setShowAdd(!showAdd)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة سؤال شائع جديد</span>
          </button>
        </div>

        {/* Self-Optimization Recommendation Box */}
        {aiMessagesToOptimize.length > 0 && (
          <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>التحسين الذاتي (Self-Optimization): أسئلة استدعت AI تكررت مؤخراً ويمكن تحويلها لـ FAQ ثابت:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {aiMessagesToOptimize.slice(0, 5).map((msg, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickConvert(msg.content)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-500/40 text-slate-200 text-xs flex items-center gap-1.5 transition-all"
                >
                  <span>"{msg.content}"</span>
                  <ArrowRight className="w-3 h-3 text-amber-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {showAdd && (
          <form onSubmit={handleCreate} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 max-w-2xl">
            <h3 className="font-bold text-white text-base">إضافة سؤال وإجابة محددة</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">السؤال المتوقع من المريض</label>
              <input
                type="text"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="مثال: الكشف بكام؟ أو فين المكان؟"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الإجابة المعتمدة من العيادة</label>
              <textarea
                required
                rows={3}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="سعر الكشف 300 ج.م..."
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
                حفظ الـ FAQ
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {faqs.map((faq) => (
            <div key={faq.id} className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">س: {faq.question}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30">
                    تم استخدامه {faq.hitCount} مرة
                  </span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed pt-1">ج: {faq.answer}</p>
              </div>

              <button
                onClick={() => handleDelete(faq.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
