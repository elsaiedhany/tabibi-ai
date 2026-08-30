"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Send, Smartphone, Sparkles, RefreshCw, Zap, ShieldAlert, Cpu, Bot, User, CheckCheck, Stethoscope } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "patient" | "bot";
  text: string;
  timestamp: string;
  handledBy?: string;
  intent?: string;
  aiCost?: number;
}

export default function SimulatorPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastMeta, setLastMeta] = useState<any>(null);

  useEffect(() => {
    fetch("/api/doctors")
      .then((r) => r.json())
      .then((data) => {
        if (data.doctors && data.doctors.length > 0) {
          setDoctors(data.doctors);
          setSelectedDoctorId(data.doctors[0].id);
          setSelectedDoctor(data.doctors[0]);
          setMessages([
            {
              id: "1",
              sender: "bot",
              text: `أهلاً بحضرتك 👋 أنا مريم، المساعدة الخاصة بـ ${data.doctors[0].name} (${data.doctors[0].specialty}). إزاي أقدر أساعدك؟`,
              timestamp: "04:00 م",
              handledBy: "RULE_TEMPLATE",
              intent: "GREETING",
              aiCost: 0,
            },
          ]);
        }
      })
      .catch(console.error);
  }, []);

  const handleDoctorChange = (docId: string) => {
    const doc = doctors.find((d) => d.id === docId);
    setSelectedDoctorId(docId);
    setSelectedDoctor(doc);
    setLastMeta(null);
    setMessages([
      {
        id: "1",
        sender: "bot",
        text: `أهلاً بحضرتك 👋 أنا مريم، المساعدة الخاصة بـ ${doc?.name} (${doc?.specialty}). إزاي أقدر أساعدك؟`,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        handledBy: "RULE_TEMPLATE",
        intent: "GREETING",
        aiCost: 0,
      },
    ]);
  };

  const presets = [
    { label: "سلام عليكم", text: "السلام عليكم" },
    { label: "كشف الدكتور بكام؟", text: "الكشف بكام؟" },
    { label: "مواعيد الدكتور ايه؟", text: "مواعيد الدكتور ايه؟" },
    { label: "عنوان العيادة والفروع", text: "فين عنوان العيادة؟" },
    { label: "حجز كشف جديد", text: "عايز احجز كشف" },
    { label: "طوارئ (ألم في الصدر)", text: "عندي ألم شديد جداً في صدري ومش قادر أتنفس" },
    { label: "عربيزي (3ayez a7gez)", text: "3ayez a7gez kashf" },
    { label: "تحويل لمساعد الاستقبال", text: "عايز اكلم حد من الاستقبال" },
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "patient",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputText("");
    setLoading(true);

    try {
      const res = await fetch("/api/simulator/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          message: textToSend,
          patientPhone: "201099887766",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.output) {
        const out = data.output;
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: out.replyText,
          timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
          handledBy: out.handledBy,
          intent: out.intent,
          aiCost: out.aiCost,
        };

        setMessages((prev) => [...prev, botMsg]);
        setLastMeta(out);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Page Header & Doctor Switcher Selector */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-brand-400" />
              <span>محاكي مساعد الواتساب الخاص بالطبيب</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">اختبر استجابة الـ AI كأنك مريض يراسل واتساب الطبيب المحدد مباشرة</p>
          </div>

          {/* Doctor Switcher Dropdown */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">اختر الطبيب للتجربة المباشرة:</label>
              <select
                value={selectedDoctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-brand-500"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} — {doc.specialty} (الكشف: {doc.consultationPrice} ج.م)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Preset Test Prompts Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-teal-400">
            <Sparkles className="w-4 h-4" />
            <span>سيناريوهات اللهجة المصرية والعربيزي المخصصة لـ {selectedDoctor?.name}:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(preset.text)}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-brand-900/60 border border-slate-700/80 hover:border-brand-500/50 text-slate-200 text-xs font-medium transition-all"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid: Phone Frame Mockup vs Execution Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* WhatsApp Phone Mockup UI (7 Cols) */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-md bg-[#0f1c1e] rounded-[36px] border-[8px] border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[650px] relative">
              {/* Phone Header (WhatsApp Green Bar) */}
              <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-emerald-400 flex items-center justify-center font-bold text-teal-300 text-sm">
                      {selectedDoctor?.name?.[3] || "د"}
                    </div>
                    <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#075e54] absolute bottom-0 left-0" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-tight">مساعدة {selectedDoctor?.name}</h3>
                    <p className="text-[10px] text-emerald-200/90 font-medium">متصل الآن • مساعد شخصي آلي</p>
                  </div>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[radial-gradient(#112e2b_1px,transparent_1px)] [background-size:16px_16px]">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === "patient" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-2.5 shadow-md text-sm leading-relaxed relative ${
                        m.sender === "patient"
                          ? "bg-[#056162] text-white rounded-tl-none"
                          : "bg-[#26383b] text-slate-100 rounded-tr-none border border-slate-700/40"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.text}</p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-300/70 font-mono">
                        <span>{m.timestamp}</span>
                        {m.sender === "patient" && <CheckCheck className="w-3 h-3 text-cyan-400" />}
                      </div>
                    </div>

                    {m.sender === "bot" && m.handledBy && (
                      <span className="text-[9px] font-mono font-bold mt-1 px-2 py-0.5 rounded-md bg-slate-900/90 text-teal-400 border border-slate-800">
                        المحرك: {m.handledBy}
                      </span>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#26383b] text-slate-400 text-xs w-fit animate-pulse">
                    <Bot className="w-4 h-4 text-teal-400" />
                    <span>تكتب الآن...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-[#1e2c2e] border-t border-slate-800 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder={`ارسل سؤالك لـ ${selectedDoctor?.name}...`}
                  className="flex-1 bg-[#121b1d] border border-slate-700/60 rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:border-teal-500"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={loading}
                  className="w-10 h-10 rounded-full bg-[#075e54] hover:bg-[#128c7e] text-white flex items-center justify-center shrink-0 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Execution Diagnostics Sidebar (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Active Doctor Profile Snapshot */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-extrabold text-white text-sm border-b border-slate-800 pb-2">
                بيانات الطبيب المعتمدة في المساعد:
              </h3>
              <div className="text-xs space-y-1.5 text-slate-300">
                <p>• **الاسم والتخصص**: {selectedDoctor?.name} ({selectedDoctor?.specialty})</p>
                <p>• **سعر الكشف**: {selectedDoctor?.consultationPrice} ج.م (المتابعة: {selectedDoctor?.followupPrice} ج.م)</p>
                <p>• **مواعيد العمل**: {selectedDoctor?.workingHours}</p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2 border-b border-slate-800 pb-3">
                <Cpu className="w-5 h-5 text-brand-400" />
                <span>تشخيص معالجة الرسالة الأخيرة</span>
              </h3>

              {lastMeta ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">محرك المعالجة</span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        lastMeta.handledBy === "LLM"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {lastMeta.handledBy}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">النية المكتشفة (Intent)</span>
                    <span className="text-xs font-bold font-mono text-teal-300">{lastMeta.intent}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">حالة آلة الحالات (State)</span>
                    <span className="text-xs font-bold font-mono text-brand-300">{lastMeta.conversationState}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-semibold">تكلفة الـ AI المباشرة</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ${lastMeta.aiCost || "0.0000 (مجاناً)"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs leading-relaxed">
                  قم بإرسال رسالة في محاكي الواتساب لرؤية خطوات المعالجة المباشرة واستهلاك التوكنز.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
