# 🛠️ Tabibi AI (طبيبي) — Support Policy & Troubleshooting Guide

> **Audience**: Platform Owner & Technical Support Team

---

## 1. Support Scope & SLA Policy

### Included in Monthly Subscription:
- Platform bug fixes & uptime monitoring.
- WhatsApp Webhook reconnect assistance.
- Minor text/template updates (e.g. changing greeting wording or updating consultation fee).
- Adding new FAQ Q&A entries (up to 10 entries per month).
- Standard email/WhatsApp technical support during business hours (9 AM – 9 PM).

### Charged Separately (Custom Work):
- Adding additional clinic branches (beyond package limit).
- Adding custom third-party integrations (e.g. custom EMR/HIS software).
- Custom UI/Dashboard modifications requested by doctor.
- In-person staff training sessions at doctor's clinic.

---

## 2. Troubleshooting Matrix for Common Operational Issues

| Symptom / Problem | Possible Root Cause | Diagnostic Step | Solution / Fix |
| :--- | :--- | :--- | :--- |
| **WhatsApp AI not replying to patients** | 1. Invalid or expired Meta Access Token.<br>2. Doctor `isActive` set to `false`.<br>3. Webhook URL misconfigured in Meta Portal. | 1. Check `/settings` for doctor token validity.<br>2. Test GET `/api/whatsapp/webhook` for `200 OK`. | 1. Re-generate System User Token in Meta Manager.<br>2. Toggle doctor `isActive` to `true` in `/doctors`. |
| **Appointments double-booking or slot unavailable** | 1. Doctor calendar working hours conflict.<br>2. Appointment already exists in DB for same date/time. | 1. Query `/api/appointments` for target date.<br>2. Check `checkDoctorAvailability()` in `src/lib/calendar.ts`. | State machine automatically catches slot conflicts and prompts patient for next slot. |
| **AI replying with generic fallback instead of dynamic doctor data** | Doctor profile details (name, prices, working hours) missing or unconfigured. | Open `/doctors` and inspect target doctor's saved fields. | Fill in missing consultation price, working hours, or specialty in `/doctors`. |
| **Human Handoff not triggering** | Patient message did not match handoff keywords or intent classification. | Check message log in `/conversations` for `detectedIntent`. | Manually toggle conversation status to `HUMAN_ACTIVE` in `/conversations`. |
| **Automated 24h reminders not sending** | 1. Cron job / reminder runner not triggered.<br>2. Doctor reminders toggled inactive. | Test POST `/api/reminders?doctorId=xyz`. | Ensure Cron Job or background runner is calling `/api/reminders` daily. |
| **Unusually High OpenAI AI Cost** | Patients asking unhandled out-of-scope questions causing fallback to LLM. | Inspect `/analytics` page for `AiUsage` breakdown. | Add matching question & answer to `/faqs` so query is answered for **0 EGP** by FAQ cache. |
| **Login fails for Doctor / Receptionist** | Incorrect email or password hash mismatch. | Check `/api/auth/login` response payload. | Re-hash user password using `bcrypt` or seed script. |

---

## 3. Disaster Recovery & Emergency Manual Override

If Meta WhatsApp Cloud API experiences global outage or OpenAI API undergoes downtime:
1. Open `/settings` on dashboard.
2. Toggle **"Emergency Human Override"**.
3. All incoming messages will automatically receive a static Egyptian Arabic template:  
   *`"أهلاً بحضرتك! نشكر تواصلك مع عيادة الدكتور. سيقوم مساعد الاستقبال بالرد عليك فوراً لمساعدتك."`*
4. All messages will be flagged as `HUMAN_ACTIVE` in `/conversations` so clinic staff can handle them directly from WhatsApp Business App.
