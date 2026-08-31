"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Settings, Save, CheckCircle2, Shield, Key, DollarSign, MessageSquare } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [aiTone, setAiTone] = useState("EGYPTIAN_FRIENDLY");
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [maxDailyAiBudget, setMaxDailyAiBudget] = useState("10.0");
  const [maxAiCallsPerDay, setMaxAiCallsPerDay] = useState("200");
  const [greetingTemplate, setGreetingTemplate] = useState("");
  const [workingHoursTemplate, setWorkingHoursTemplate] = useState("");
  const [handoffTemplate, setHandoffTemplate] = useState("");
  const [whatsappAccessToken, setWhatsappAccessToken] = useState("");
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState("");
  const [whatsappVerifyToken, setWhatsappVerifyToken] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.clinic) {
          const c = data.clinic;
          setName(c.name || "");
          setAddress(c.address || "");
          setPhone(c.phone || "");
          setWhatsappNumber(c.whatsappNumber || "");
          setAiTone(c.aiTone || "EGYPTIAN_FRIENDLY");
          setMaxDailyAiBudget(c.maxDailyAiBudget?.toString() || "10.0");
          setMaxAiCallsPerDay(c.maxAiCallsPerDay?.toString() || "200");

          if (c.settings) {
            setIsAiEnabled(c.settings.isAiEnabled ?? true);
            setGreetingTemplate(c.settings.greetingTemplate || "");
            setWorkingHoursTemplate(c.settings.workingHoursTemplate || "");
            setHandoffTemplate(c.settings.handoffTemplate || "");
            setWhatsappAccessToken(c.settings.whatsappAccessToken || "");
            setWhatsappPhoneNumberId(c.settings.whatsappPhoneNumberId || "");
            setWhatsappVerifyToken(c.settings.whatsappVerifyToken || "");
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          phone,
          whatsappNumber,
          aiTone,
          isAiEnabled,
          maxDailyAiBudget,
          maxAiCallsPerDay,
          greetingTemplate,
          workingHoursTemplate,
          handoffTemplate,
          whatsappAccessToken,
          whatsappPhoneNumberId,
          whatsappVerifyToken,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white">إعدادات وتكوين العيادة</h1>
            <p className="text-slate-400 text-sm">تعديل بيانات العيادة والقوالب وميزانية الـ AI وربط الواتساب دون تغيير الكود</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-brand-500/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "جاري الحفظ..." : "حفظ التغييرات"}</span>
          </button>
        </div>

        {saved && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>تم حفظ إعدادات العيادة بنجاح!</span>
          </div>
        )}

        {/* Section 1: Basic Clinic Information */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-extrabold text-white text-base border-b border-slate-800 pb-3">بيانات العيادة الأساسية</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">اسم العيادة</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">رقم الهاتف والتواصل</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان العيادة التفصيلي</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
            />
          </div>
        </div>

        {/* Section 2: AI Control & Budget Limits */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <span>مساعد الذكاء الاصطناعي وحدود الميزانية</span>
            </h3>

            {/* AI Global Toggle Switch */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300">
                {isAiEnabled ? "تفعيل الـ AI للمحادثات ⚡" : "إيقاف الـ AI (تحويل مباشر للاستقبال) ⏸️"}
              </span>
              <button
                type="button"
                onClick={() => setIsAiEnabled(!isAiEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isAiEnabled ? "bg-brand-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isAiEnabled ? "translate-x-0" : "-translate-x-5"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الحد الأقصى للميزانية اليومية ($ USD)</label>
              <input
                type="number"
                step="0.5"
                value={maxDailyAiBudget}
                onChange={(e) => setMaxDailyAiBudget(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">الحد الأقصى لاستدعاءات الـ AI اليومية</label>
              <input
                type="number"
                value={maxAiCallsPerDay}
                onChange={(e) => setMaxAiCallsPerDay(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Configurable Response Templates */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-extrabold text-white text-base border-b border-slate-800 pb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-400" />
            <span>قوالب الردود الآلية للعيادة (Custom Templates)</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">قالب الترحيب الأولي</label>
            <input
              type="text"
              value={greetingTemplate}
              onChange={(e) => setGreetingTemplate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">قالب مواعيد العمل</label>
            <input
              type="text"
              value={workingHoursTemplate}
              onChange={(e) => setWorkingHoursTemplate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">قالب التحويل للاستقبال البشري</label>
            <input
              type="text"
              value={handoffTemplate}
              onChange={(e) => setHandoffTemplate(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
            />
          </div>
        </div>

        {/* Section 4: WhatsApp Cloud API Credentials */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="font-extrabold text-white text-base border-b border-slate-800 pb-3 flex items-center gap-2">
            <Key className="w-5 h-5 text-brand-400" />
            <span>ربط مفاتيح Meta WhatsApp Cloud API</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp Access Token</label>
            <input
              type="password"
              value={whatsappAccessToken}
              onChange={(e) => setWhatsappAccessToken(e.target.value)}
              placeholder="EAAX..."
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number ID</label>
              <input
                type="text"
                value={whatsappPhoneNumberId}
                onChange={(e) => setWhatsappPhoneNumberId(e.target.value)}
                placeholder="123456789012345"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Webhook Verify Token</label>
              <input
                type="password"
                value={whatsappVerifyToken}
                onChange={(e) => setWhatsappVerifyToken(e.target.value)}
                placeholder="أدخل توكن التحقق (Webhook Verify Token)"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-mono"
              />
            </div>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
