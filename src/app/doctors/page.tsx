"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Stethoscope, Save, Plus, MapPin, CheckCircle2, DollarSign, Clock, UserPlus, X } from "lucide-react";

export default function DoctorProfilePage() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [doctor, setDoctor] = useState<any>(null);

  // New Doctor Modal state
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocSpecialty, setNewDocSpecialty] = useState("");
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocWhatsapp, setNewDocWhatsapp] = useState("");
  const [newDocPrice, setNewDocPrice] = useState("500");
  const [newDocFollowup, setNewDocFollowup] = useState("300");

  // Form states for selected doctor
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [subSpecialty, setSubSpecialty] = useState("");
  const [gender, setGender] = useState("MALE");
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("12");
  const [consultationPrice, setConsultationPrice] = useState("500");
  const [followupPrice, setFollowupPrice] = useState("300");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [aiName, setAiName] = useState("مريم");
  const [aiTone, setAiTone] = useState("EGYPTIAN_FRIENDLY");

  // Branches/Locations state
  const [locations, setLocations] = useState<any[]>([]);
  const [showAddLoc, setShowAddLoc] = useState(false);
  const [locName, setLocName] = useState("");
  const [locAddress, setLocAddress] = useState("");
  const [locPhone, setLocPhone] = useState("");

  const fetchDoctorProfile = async (targetId?: string) => {
    try {
      const url = targetId ? `/api/doctors?id=${targetId}` : "/api/doctors";
      const res = await fetch(url);
      const data = await res.json();

      if (data.doctors) {
        setDoctorsList(data.doctors);
      }

      const activeDoc = data.doctor || data.doctors?.[0];
      if (activeDoc) {
        setDoctor(activeDoc);
        setSelectedDoctorId(activeDoc.id);
        setName(activeDoc.name || "");
        setTitle(activeDoc.title || "");
        setSpecialty(activeDoc.specialty || "");
        setSubSpecialty(activeDoc.subSpecialty || "");
        setGender(activeDoc.gender || "MALE");
        setBio(activeDoc.bio || "");
        setExperienceYears(activeDoc.experienceYears?.toString() || "12");
        setConsultationPrice(activeDoc.consultationPrice?.toString() || "500");
        setFollowupPrice(activeDoc.followupPrice?.toString() || "300");
        setWhatsappNumber(activeDoc.whatsappNumber || "");
        setPhone(activeDoc.phone || "");
        setWorkingHours(activeDoc.workingHours || "");
        setAiName(activeDoc.aiName || "مريم");
        setAiTone(activeDoc.aiTone || "EGYPTIAN_FRIENDLY");
        setLocations(activeDoc.locations || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const handleSelectDoctorChange = (id: string) => {
    fetchDoctorProfile(id);
  };

  const handleCreateNewDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName || !newDocSpecialty || !newDocWhatsapp) return;

    try {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDocName,
          title: newDocTitle || `استشاري ${newDocSpecialty}`,
          specialty: newDocSpecialty,
          whatsappNumber: newDocWhatsapp,
          consultationPrice: newDocPrice,
          followupPrice: newDocFollowup,
          workingHours: "السبت إلى الخميس: 4:00 مساءً - 10:00 مساءً",
          aiName: "مريم",
        }),
      });

      const data = await res.json();
      if (res.ok && data.doctor) {
        setShowAddDoctorModal(false);
        setNewDocName("");
        setNewDocSpecialty("");
        setNewDocTitle("");
        setNewDocWhatsapp("");
        fetchDoctorProfile(data.doctor.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);

    try {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedDoctorId,
          name,
          title,
          specialty,
          subSpecialty,
          gender,
          bio,
          experienceYears,
          consultationPrice,
          followupPrice,
          whatsappNumber,
          phone,
          workingHours,
          aiName,
          aiTone,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        fetchDoctorProfile(selectedDoctorId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName || !locAddress) return;

    await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: selectedDoctorId,
        name: locName,
        address: locAddress,
        phone: locPhone,
      }),
    });

    setLocName("");
    setLocAddress("");
    setLocPhone("");
    setShowAddLoc(false);
    fetchDoctorProfile(selectedDoctorId);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header & Doctor Selection / Add Flow */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">إدارة ملف الأطباء والفروع</h1>
            <p className="text-slate-400 text-sm">إضافة أطباء جدد للنظام، تكوين الأسعار، ومساعد الواتساب الـ AI</p>
          </div>

          <div className="flex items-center gap-3">
            {doctorsList.length > 0 && (
              <select
                value={selectedDoctorId}
                onChange={(e) => handleSelectDoctorChange(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs"
              >
                {doctorsList.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.specialty}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => setShowAddDoctorModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-brand-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة طبيب جديد</span>
            </button>
          </div>
        </div>

        {/* Modal: Add New Doctor Flow */}
        {showAddDoctorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-teal-400" />
                  <span>إضافة طبيب جديد للنظام</span>
                </h3>
                <button onClick={() => setShowAddDoctorModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNewDoctor} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">اسم الطبيب الكامل *</label>
                  <input
                    type="text"
                    required
                    placeholder="د. محمد السعيد"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">التخصص الطبي *</label>
                  <input
                    type="text"
                    required
                    placeholder="أمراض الباطنة والسكر"
                    value={newDocSpecialty}
                    onChange={(e) => setNewDocSpecialty(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">رقم واتساب الطبيب *</label>
                  <input
                    type="text"
                    required
                    placeholder="201011223344"
                    value={newDocWhatsapp}
                    onChange={(e) => setNewDocWhatsapp(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">سعر الكشف (ج.م)</label>
                    <input
                      type="number"
                      value={newDocPrice}
                      onChange={(e) => setNewDocPrice(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">سعر المتابعة (ج.م)</label>
                    <input
                      type="number"
                      value={newDocFollowup}
                      onChange={(e) => setNewDocFollowup(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold text-teal-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddDoctorModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold"
                  >
                    إنشاء حساب الطبيب
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">تعديل ملف الطبيب المحدد: ({name})</h2>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-brand-500/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? "جاري الحفظ..." : "حفظ التعديلات"}</span>
            </button>
          </div>

          {saved && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>تم تحديث ملف الطبيب ومساعد الواتساب بنجاح!</span>
            </div>
          )}

          {/* Section 1: Doctor Identity */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-white text-base border-b border-slate-800 pb-3 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-400" />
              <span>البيانات الشخصية والمهنية للطبيب</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الطبيب الكامل</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: د. أحمد محمد"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">التخصص الرئيسي</label>
                <input
                  type="text"
                  required
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="مثال: جلدية وتجميل"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">اللقب والدرجة العلمية</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="استشاري الأمراض الجلدية وتجميل الجلد بالليزر..."
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">سنوات الخبرة</label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">النوع</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                >
                  <option value="MALE">طبيب (ذكر)</option>
                  <option value="FEMALE">طبيبة (أنثى)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">نبذة عن الطبيب (Bio)</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="خبرة 15 عاماً في العلاجات الجلدية المتقدمة والتجميل..."
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
              />
            </div>
          </div>

          {/* Section 2: Pricing & Working Hours */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-white text-base border-b border-slate-800 pb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>تسعير الكشف والمواعيد</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">سعر الكشف الرئيسي (ج.م EGP)</label>
                <input
                  type="number"
                  required
                  value={consultationPrice}
                  onChange={(e) => setConsultationPrice(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">سعر المتابعة (ج.م EGP)</label>
                <input
                  type="number"
                  required
                  value={followupPrice}
                  onChange={(e) => setFollowupPrice(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm font-bold text-teal-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">مواعيد عمل الطبيب الرسمية</label>
              <input
                type="text"
                required
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                placeholder="السبت إلى الخميس: 4:00 مساءً - 10:00 مساءً"
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
              />
            </div>
          </div>

          {/* Section 3: Branches & Locations */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-400" />
                <span>فروع وعناوين العيادات الخاضعة للطبيب</span>
              </h3>

              <button
                type="button"
                onClick={() => setShowAddLoc(!showAddLoc)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة فرع جديد</span>
              </button>
            </div>

            {showAddLoc && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700 space-y-3">
                <h4 className="font-bold text-white text-xs">إضافة فرع جديد للعيادة</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="اسم الفرع (مثال: فرع المعادي)"
                    value={locName}
                    onChange={(e) => setLocName(e.target.value)}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                  <input
                    type="text"
                    placeholder="هاتف الفرع"
                    value={locPhone}
                    onChange={(e) => setLocPhone(e.target.value)}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                  />
                </div>
                <input
                  type="text"
                  placeholder="العنوان التفصيلي"
                  value={locAddress}
                  onChange={(e) => setLocAddress(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddLoc(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleAddLocation}
                    className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-bold"
                  >
                    حفظ الفرع
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {locations.map((loc) => (
                <div key={loc.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{loc.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{loc.address}</p>
                  </div>
                  {loc.isPrimary && (
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-bold border border-brand-500/30">
                      الفرع الرئيسي
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: AI Receptionist Persona */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-white text-base border-b border-slate-800 pb-3">
              شخصية ومساعد الـ AI الخاص بالدكتور
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم مساعدة الـ AI</label>
                <input
                  type="text"
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                  placeholder="مريم"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">أسلوب الرد (Tone)</label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
                >
                  <option value="EGYPTIAN_FRIENDLY">عامية مصرية ودية واحترافية (افتراضي)</option>
                  <option value="FORMAL_ARABIC">لغة عربية فصحى رسمية</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
