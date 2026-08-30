"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  Building2,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Clock3,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userStatus, setUserStatus] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Step 1: Doctor Profile State
  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("أمراض الباطنة والسكر");
  const [title, setTitle] = useState("استشاري الباطنة العامة والمناعة");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  // Step 2: Clinic Info State
  const [clinicName, setClinicName] = useState("");
  const [governorate, setGovernorate] = useState("القاهرة");
  const [district, setDistrict] = useState("مدينة نصر");
  const [address, setAddress] = useState("شارع الطيران - برج الأطباء - الدور الثالث");
  const [landmark, setLandmark] = useState("بجوار مستشفى حسبو");
  const [clinicPhone, setClinicPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Step 3: Working Hours State
  const [workingDays, setWorkingDays] = useState<any>({
    السبت: { active: true, from: "16:00", to: "22:00" },
    الأحد: { active: true, from: "16:00", to: "22:00" },
    الإثنين: { active: true, from: "16:00", to: "22:00" },
    الثلاثاء: { active: true, from: "16:00", to: "22:00" },
    الأربعاء: { active: true, from: "16:00", to: "22:00" },
    الخميس: { active: true, from: "16:00", to: "22:00" },
    الجمعة: { active: false, from: "16:00", to: "22:00" },
  });

  // Step 4: Services & Pricing State
  const [consultationPrice, setConsultationPrice] = useState("500");
  const [followupPrice, setFollowupPrice] = useState("300");
  const [consultationDuration, setConsultationDuration] = useState("30");
  const [services, setServices] = useState<any[]>([
    { name: "كشف عام وفحص شامل", price: "500", durationMin: "30" },
    { name: "استشارة ومتابعة تحليل", price: "300", durationMin: "15" },
  ]);

  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("400");

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data) => {
        if (data.userStatus) setUserStatus(data.userStatus);
        if (data.userStatus === "PENDING_APPROVAL") {
          setSubmitted(true);
        }

        if (data.application) {
          const app = data.application;
          setCurrentStep(app.step || 1);

          if (app.doctorData) {
            const doc = JSON.parse(app.doctorData);
            if (doc.name) setDoctorName(doc.name);
            if (doc.specialty) setSpecialty(doc.specialty);
            if (doc.title) setTitle(doc.title);
            if (doc.phone) setPhone(doc.phone);
            if (doc.bio) setBio(doc.bio);
          }

          if (app.clinicData) {
            const cl = JSON.parse(app.clinicData);
            if (cl.clinicName) setClinicName(cl.clinicName);
            if (cl.address) setAddress(cl.address);
            if (cl.governorate) setGovernorate(cl.governorate);
            if (cl.district) setDistrict(cl.district);
            if (cl.whatsappNumber) setWhatsappNumber(cl.whatsappNumber);
            if (cl.consultationPrice) setConsultationPrice(cl.consultationPrice);
            if (cl.followupPrice) setFollowupPrice(cl.followupPrice);
          }

          if (app.servicesData) {
            const s = JSON.parse(app.servicesData);
            if (Array.isArray(s) && s.length > 0) setServices(s);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const saveProgress = async (nextStep: number, isSubmit: boolean = false) => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: nextStep,
          doctorData: { name: doctorName, specialty, title, phone, bio },
          clinicData: {
            clinicName,
            governorate,
            district,
            address,
            landmark,
            clinicPhone,
            whatsappNumber,
            consultationPrice,
            followupPrice,
            consultationDuration,
          },
          workingHoursData: workingDays,
          servicesData: services,
          submitApplication: isSubmit,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (isSubmit) {
          setSubmitted(true);
          setUserStatus("PENDING_APPROVAL");
        } else {
          setCurrentStep(nextStep);
        }
      } else {
        setError(data.error || "فشل حفظ البيانات");
      }
    } catch (err) {
      setError("حدث خطأ أثناء حفظ البيانات");
    } finally {
      setSaving(false);
    }
  };

  const handleAddService = () => {
    if (!newServiceName) return;
    setServices([...services, { name: newServiceName, price: newServicePrice, durationMin: "30" }]);
    setNewServiceName("");
    setNewServicePrice("400");
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b132b] text-white flex items-center justify-center dir-rtl">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-bold">جاري تحميل خطوات إعداد العيادة...</p>
        </div>
      </div>
    );
  }

  // Submitted / Under Review Screen
  if (submitted || userStatus === "PENDING_APPROVAL") {
    return (
      <div className="min-h-screen bg-[#0b132b] text-slate-100 flex items-center justify-center p-4 dir-rtl">
        <div className="w-full max-w-lg bg-[#0f172a]/90 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 backdrop-blur-2xl">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <Clock3 className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">طلبك حالياً قيد المراجعة</h1>
            <p className="text-slate-300 text-xs leading-relaxed max-w-md mx-auto">
              تم استلام بيانات الطبيب والعيادة بنجاح. سنقوم بمراجعة طلبك وتفعيل الاشتراك وحساب العيادة في أقرب وقت.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 text-right space-y-1">
            <p className="font-bold text-white">حالة الطلب الحالية:</p>
            <div className="flex items-center justify-between text-amber-400 font-bold pt-1">
              <span>قيد المراجعة (PENDING_APPROVAL)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-center">
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              العودة لصفحة الدخول
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stepsList = [
    { title: "بيانات الطبيب", icon: Stethoscope },
    { title: "بيانات العيادة", icon: Building2 },
    { title: "مواعيد العمل", icon: Clock },
    { title: "الخدمات والأسعار", icon: Sparkles },
    { title: "مراجعة وإرسال", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-[#0b132b] text-slate-100 p-4 sm:p-6 lg:p-8 dir-rtl flex flex-col justify-between">
      <div className="max-w-3xl mx-auto w-full space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center font-black text-white text-xl">
              ط
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white">إعداد عيادة طبيبي AI</h1>
              <p className="text-xs text-slate-400">خطوات بسيطة لتفعيل مساعد الواتساب واستقبال المرضى</p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
            الخطوة {currentStep} من 5
          </span>
        </div>

        {/* Progress Steps Bar */}
        <div className="grid grid-cols-5 gap-2">
          {stepsList.map((st, idx) => {
            const stepNum = idx + 1;
            const Icon = st.icon;
            const isActive = currentStep === stepNum;
            const isDone = currentStep > stepNum;

            return (
              <div
                key={stepNum}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                  isActive
                    ? "bg-brand-600/20 border-brand-500 text-white shadow-lg shadow-brand-500/10"
                    : isDone
                    ? "bg-slate-900 border-teal-500/40 text-teal-400"
                    : "bg-slate-900/50 border-slate-800 text-slate-500"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-bold hidden sm:inline">{st.title}</span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Doctor Profile */}
        {currentStep === 1 && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Stethoscope className="w-5 h-5 text-teal-400" />
              <span>الخطوة 1: البيانات الشخصية والمهنية للطبيب</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم الطبيب الكامل *</label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="د. أحمد محمد السعيد"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-white text-sm focus:border-brand-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">التخصص الرئيسي *</label>
                  <input
                    type="text"
                    required
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="أمراض الباطنة والسكر"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-white text-sm focus:border-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الدرجة العلمية واللقب *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="استشاري الأمراض الباطنية والمناعة"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-white text-sm focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">نبذة عن الطبيب (Bio)</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="خبرة 15 عاماً في العلاجات الجلدية والمناعية..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-white text-sm focus:border-brand-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Clinic Details */}
        {currentStep === 2 && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Building2 className="w-5 h-5 text-teal-400" />
              <span>الخطوة 2: بيانات العيادة ورقم الواتساب</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم العيادة / المركز الطبي *</label>
                <input
                  type="text"
                  required
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="عيادات د. أحمد السعيد التخصصية"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-white text-sm focus:border-brand-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">المحافظة *</label>
                  <input
                    type="text"
                    required
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    placeholder="القاهرة"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-white text-sm focus:border-brand-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">المنطقة / الحي *</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="مدينة نصر"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-white text-sm focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">العنوان التفصيلي والعلامة المميزة *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="شارع الطيران - عمارة 15 - الدور الثالث - بجوار مستشفى حسبو"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-white text-sm focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">رقم واتساب العيادة المخصص للاستقبال *</label>
                <input
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="201012345678"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-white text-sm focus:border-brand-500 outline-none font-mono dir-ltr text-right"
                />
                <p className="text-[11px] text-slate-400 mt-1">هذا الرقم سيتم ربطه بمساعد الذكاء الاصطناعي (مريم) لاستقبال رسائل المرضى.</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Working Hours */}
        {currentStep === 3 && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Clock className="w-5 h-5 text-teal-400" />
              <span>الخطوة 3: مواعيد الكشف الرسمية بالعيادة</span>
            </h2>

            <div className="space-y-3">
              {Object.keys(workingDays).map((day) => {
                const dayObj = workingDays[day];
                return (
                  <div key={day} className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer w-24">
                      <input
                        type="checkbox"
                        checked={dayObj.active}
                        onChange={(e) =>
                          setWorkingDays({
                            ...workingDays,
                            [day]: { ...dayObj, active: e.target.checked },
                          })
                        }
                        className="rounded border-slate-700 bg-slate-950 text-brand-500"
                      />
                      <span>{day}</span>
                    </label>

                    {dayObj.active ? (
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-slate-400">من</span>
                        <input
                          type="time"
                          value={dayObj.from}
                          onChange={(e) =>
                            setWorkingDays({
                              ...workingDays,
                              [day]: { ...dayObj, from: e.target.value },
                            })
                          }
                          className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-white text-xs"
                        />
                        <span className="text-slate-400">إلى</span>
                        <input
                          type="time"
                          value={dayObj.to}
                          onChange={(e) =>
                            setWorkingDays({
                              ...workingDays,
                              [day]: { ...dayObj, to: e.target.value },
                            })
                          }
                          className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-white text-xs"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-rose-400 font-bold px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
                        مغلق
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Services & Pricing */}
        {currentStep === 4 && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-5">
            <h2 className="text-lg font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-5 h-5 text-teal-400" />
              <span>الخطوة 4: خدمات الكشف وتدقيق الأسعار</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">سعر الكشف الرئيسي (ج.م EGP) *</label>
                <input
                  type="number"
                  required
                  value={consultationPrice}
                  onChange={(e) => setConsultationPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-white font-bold text-emerald-400 text-sm focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">سعر الاستشارة / المتابعة (ج.م EGP) *</label>
                <input
                  type="number"
                  required
                  value={followupPrice}
                  onChange={(e) => setFollowupPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-white font-bold text-teal-400 text-sm focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            {/* Services List Add Box */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-300">خدمات العيادة الإضافية:</label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="اسم الخدمة (مثال: رسم قلب، تنظيف بشرة...)"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
                />
                <input
                  type="number"
                  placeholder="السعر (ج.م)"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                  className="w-28 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={handleAddService}
                  className="px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة</span>
                </button>
              </div>

              <div className="space-y-2">
                {services.map((s, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs">{s.name}</span>
                      <span className="text-slate-400 text-[11px] block">{s.durationMin || 30} دقيقة</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-bold text-xs">{s.price} ج.م</span>
                      <button onClick={() => handleRemoveService(idx)} className="text-slate-500 hover:text-rose-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {currentStep === 5 && (
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
            <h2 className="text-lg font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>الخطوة 5: مراجعة البيانات وإرسال طلب الاشتراك</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold">بيانات الطبيب:</span>
                <p className="text-white font-bold">{doctorName} — {specialty}</p>
                <p className="text-slate-300">{title}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold">بيانات العيادة والواتساب:</span>
                <p className="text-white font-bold">{clinicName}</p>
                <p className="text-slate-300">{address} ({governorate} - {district})</p>
                <p className="text-teal-400 font-mono font-bold">واتساب الاستقبال: {whatsappNumber}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold">الأسعار والخدمات:</span>
                <p className="text-emerald-400 font-bold">سعر الكشف: {consultationPrice} ج.م | المتابعة: {followupPrice} ج.م</p>
              </div>
            </div>
          </div>
        )}

        {/* Step Control Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {currentStep > 1 ? (
            <button
              onClick={() => saveProgress(currentStep - 1)}
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>الرجوع</span>
            </button>
          ) : <div />}

          {currentStep < 5 ? (
            <button
              onClick={() => saveProgress(currentStep + 1)}
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-brand-600/20 flex items-center gap-2"
            >
              <span>{saving ? "جاري الحفظ..." : "التالي"}</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => saveProgress(5, true)}
              disabled={saving}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-brand-600 hover:from-emerald-500 hover:to-brand-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{saving ? "جاري الإرسال..." : "إرسال طلب الاشتراك للمراجعة"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
