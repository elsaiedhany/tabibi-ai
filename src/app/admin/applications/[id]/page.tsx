"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Stethoscope,
  Building2,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  AlertCircle,
  DollarSign,
  UserCheck,
} from "lucide-react";

export default function AdminApplicationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Approval Options State
  const [plan, setPlan] = useState("PRO");
  const [subscriptionType, setSubscriptionType] = useState("ACTIVE"); // ACTIVE or TRIAL
  const [trialDays, setTrialDays] = useState("7");

  // Rejection Modal State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/applications/${params.id}`);
      const data = await res.json();
      if (data.application) setApplication(data.application);
    } catch (e) {
      setError("حدث خطأ أثناء تحميل بيانات الطلب");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [params.id]);

  const handleApprove = async () => {
    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/applications/${params.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, subscriptionType, trialDays }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess("تمت الموافقة على الطلب وتفعيل حساب الدكتور والاشتراك بنجاح!");
        fetchApplication();
      } else {
        setError(data.error || "فشل اعتماد الطلب");
      }
    } catch (err) {
      setError("حدث خطأ أثناء الاتصال بالسيرفر");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/applications/${params.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setShowRejectModal(false);
        setSuccess("تم رفض الطلب بنجاح وإشعار الدكتور بالسبب.");
        fetchApplication();
      } else {
        setError(data.error || "فشل رفض الطلب");
      }
    } catch (err) {
      setError("حدث خطأ أثناء الاتصال بالسيرفر");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-slate-400">جاري تحميل تفاصيل الطلب...</div>
      </DashboardLayout>
    );
  }

  if (!application) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-rose-400">طلب الاشتراك غير موجود</div>
      </DashboardLayout>
    );
  }

  const docInfo = application.doctorData ? JSON.parse(application.doctorData) : {};
  const clinicInfo = application.clinicData ? JSON.parse(application.clinicData) : {};
  const servicesList = application.servicesData ? JSON.parse(application.servicesData) : [];
  const hoursList = application.workingHoursData ? JSON.parse(application.workingHoursData) : {};

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/applications" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white">مراجعة طلب اشتراك العيادة</h1>
              <p className="text-slate-400 text-xs mt-0.5">مقدم من: {application.user?.name} ({application.user?.email})</p>
            </div>
          </div>

          <span
            className={`px-4 py-1.5 rounded-full text-xs font-black ${
              application.status === "APPROVED"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : application.status === "REJECTED"
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
          >
            حالة الطلب: {application.status}
          </span>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Application Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Doctor Info */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <h3 className="font-extrabold text-white text-base border-b border-slate-800 pb-3 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-400" />
              <span>بيانات الدكتور الشخصية والمهنية</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block">الاسم بالكامل:</span>
                <span className="text-white font-bold">{docInfo.name || application.user?.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">التخصص الرئيسي:</span>
                <span className="text-white font-bold">{docInfo.specialty || "غير محدد"}</span>
              </div>
              <div>
                <span className="text-slate-400 block">الدرجة العلمية:</span>
                <span className="text-slate-200">{docInfo.title || "استشاري"}</span>
              </div>
              <div>
                <span className="text-slate-400 block">الموبايل الشخصي:</span>
                <span className="text-teal-400 font-mono font-bold">{docInfo.phone || "غير مدخل"}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Clinic Details */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
            <h3 className="font-extrabold text-white text-base border-b border-slate-800 pb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-400" />
              <span>بيانات العيادة والعنوان والواتساب</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block">اسم العيادة:</span>
                <span className="text-white font-bold">{clinicInfo.clinicName || "الفرع الرئيسي"}</span>
              </div>
              <div>
                <span className="text-slate-400 block">العنوان:</span>
                <span className="text-slate-200">{clinicInfo.address} ({clinicInfo.governorate} - {clinicInfo.district})</span>
              </div>
              <div>
                <span className="text-slate-400 block">واتساب الاستقبال المطلوب ربطه:</span>
                <span className="text-teal-300 font-mono font-bold text-sm dir-ltr text-right block">{clinicInfo.whatsappNumber || "غير مدخل"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Services & Prices */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
          <h3 className="font-extrabold text-white text-base border-b border-slate-800 pb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>خدمات وأسعار الكشف المقدمة</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block">سعر الكشف الرئيسي:</span>
              <span className="text-emerald-400 font-black text-lg">{clinicInfo.consultationPrice || 500} ج.م</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block">سعر المتابعة / الاستشارة:</span>
              <span className="text-teal-400 font-black text-lg">{clinicInfo.followupPrice || 300} ج.م</span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-slate-400 text-xs font-bold block">الخدمات الإضافية:</span>
            {servicesList.length === 0 ? (
              <p className="text-xs text-slate-500">لا توجد خدمات إضافية مدخلة.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {servicesList.map((s: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between text-xs">
                    <span className="text-white font-bold">{s.name}</span>
                    <span className="text-emerald-400 font-bold">{s.price} ج.م</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Subscription & Approval Controls */}
        {application.status === "PENDING" && (
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-white text-base border-b border-slate-800 pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-400" />
              <span>إعدادات الباقة وتفعيل الاشتراك</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">باقة الاشتراك (Plan) *</label>
                <select
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                >
                  <option value="STARTER">باقة STARTER (عيادة واحدة)</option>
                  <option value="PRO">باقة PRO (مساعد AI متقدم + تذكيرات)</option>
                  <option value="ENTERPRISE">باقة ENTERPRISE (فروع متعددة)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">نوع التفعيل *</label>
                <select
                  value={subscriptionType}
                  onChange={(e) => setSubscriptionType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                >
                  <option value="ACTIVE">تفعيل مدفوع مباشر (ACTIVE)</option>
                  <option value="TRIAL">فترة تجريبية مجانية (TRIAL)</option>
                </select>
              </div>

              {subscriptionType === "TRIAL" && (
                <div>
                  <label className="block font-bold text-slate-300 mb-1">مدة التجربة (أيام) *</label>
                  <input
                    type="number"
                    value={trialDays}
                    onChange={(e) => setTrialDays(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs"
              >
                رفض الطلب
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-brand-600 hover:from-emerald-500 hover:to-brand-500 text-white font-black text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{actionLoading ? "جاري الاعتماد وتفعيل العيادة..." : "قبول الطلب وتفعيل الاشتراك"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm dir-rtl">
            <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <h3 className="font-extrabold text-white text-base">رفض طلب اشتراك العيادة</h3>
              <p className="text-xs text-slate-400">يرجى كتابة سبب الرفض ليظهر للطبيب عند محاولة تسجيل الدخول:</p>

              <form onSubmit={handleReject} className="space-y-4">
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="مثال: يرجى توضيح رقم واتساب العيادة أو العنوان التفصيلي..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-white text-xs"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                  >
                    تأكيد الرفض
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
