# 📘 Tabibi AI (طبيبي) — Owner Operations & Platform Manual

> **Product**: Tabibi AI (طبيبي) — AI WhatsApp Receptionist & Booking Automation System for Egyptian Doctors  
> **Audience**: Platform Owner & System Administrator  
> **Version**: 2.0 (Doctor-Centric Tenancy Architecture)

---

## 1. System Overview

Tabibi AI is a commercial multi-tenant AI WhatsApp receptionist designed specifically for Egyptian medical clinics and individual doctors. 

### Key Principles:
- **Tenant Entity**: The **Individual Doctor** (`Doctor`) is the primary customer and isolation boundary.
- **WhatsApp Assistant**: Every doctor gets their own AI receptionist (e.g. "مريم" or "سلمى") responding on their dedicated WhatsApp number.
- **Code First, AI Last**: Cost-optimization architecture. 80%+ of incoming patient messages (greetings, working hours, pricing, booking steps, FAQs) are handled deterministically without calling OpenAI APIs.
- **Zero Cross-Doctor Leakage**: Data (`patients`, `appointments`, `conversations`, `prices`, `services`, `faqs`, `aiUsage`) is strictly isolated by `doctorId`.

---

## 2. Dashboard Navigation & Usage

Access the administrative interface at `http://localhost:3000` (or your production domain):

| Page Route | Purpose | Key Actions |
| :--- | :--- | :--- |
| `/dashboard` | Executive Overview | View doctor-specific metrics, pending human escalations, today's appointments, and AI savings. |
| `/simulator` | WhatsApp Simulator | Select any doctor and test AI responses in real-time before going live with patients. |
| `/conversations` | Patient Chats & Handoff | View live WhatsApp chats. Take over a chat (`HUMAN_ACTIVE`) or return control to AI (`AI_ACTIVE`). |
| `/appointments` | Calendar & Bookings | View, filter, reschedule, or cancel patient appointments. |
| `/doctors` | Doctor Profile & Branches | Create new doctor accounts, update doctor bio, specialty, prices, and manage branch locations. |
| `/services` | Medical Services | Add or edit custom services and prices for the active doctor. |
| `/patients` | Patient Directory | View patient contact history, notes, and appointment records. |
| `/faqs` | FAQ Cache Engine | Add exact/fuzzy Q&A entries to answer common patient questions instantly for 0 EGP AI cost. |
| `/reminders` | Automated Reminders | Trigger or test automated 24-hour appointment reminder messages. |
| `/analytics` | Token & Cost Audit | Track OpenAI token usage, budget guardrails, and cost-saving metrics. |
| `/settings` | AI Persona Config | Customize greeting templates, working hours text, handoff messages, and Meta Webhook tokens. |

---

## 3. How to Create a New Doctor Account

You can create a new doctor account completely from the Admin UI without touching code or database scripts:

1. Open `/doctors` on the dashboard.
2. Click **"+ إضافة طبيب جديد"** (Add New Doctor).
3. Fill in the modal fields:
   - **Doctor Name**: e.g., `د. محمد السعيد`
   - **Specialty**: e.g., `أمراض الباطنة والسكر`
   - **WhatsApp Phone**: e.g., `201011223344`
   - **Consultation Price (EGP)**: e.g., `500`
   - **Follow-up Price (EGP)**: e.g., `300`
4. Click **"إنشاء حساب الطبيب"** (Create Doctor Account).
5. The system will create the doctor record, initialize default settings, and create default template responses automatically.

---

## 4. How to Configure Doctor Information & AI Behavior

Select the doctor from the dropdown header on `/doctors`:

### A. Personal & Professional Profile
- **Full Title**: e.g., `استشاري الأمراض الباطنية والسكر - جامعة القاهرة`
- **Experience Years**: e.g., `15`
- **Bio**: Short summary used by the AI when patients ask "مين الدكتور؟" or "ايه خبرة الدكتور؟".

### B. Pricing & Working Hours
- **Consultation Price**: Set the default main visit fee in EGP.
- **Followup Price**: Set the follow-up fee within the 14-day window.
- **Working Hours**: e.g., `السبت إلى الخميس: 4:00 مساءً - 10:00 مساءً`.

### C. Branch Locations
- Click **"+ إضافة فرع جديد"** under Locations.
- Add branch name (e.g., `فرع مدينة نصر`), detailed address (`شارع الطيران - برج الأطباء`), and phone number.
- The AI will automatically reference all branches when asked "فين عيادة الدكتور؟".

### D. AI Persona Settings
- **Assistant Name**: e.g., `مريم` or `سارة`.
- **Tone**: `EGYPTIAN_FRIENDLY` (Friendly Egyptian Arabic) or `FORMAL_ARABIC` (Formal Modern Standard).

---

## 5. How to Disable, Suspend, or Delete a Doctor Safely

### Suspending an Active Doctor:
1. Open `/doctors` and select the doctor.
2. Toggle `isActive` to `false` (or set `maxDailyAiBudget` to `0.0`).
3. Incoming WhatsApp messages for this doctor will automatically route to the human receptionist fallback template without invoking AI APIs.

### Deleting a Doctor Account:
- **Cascade Security**: The database schema enforces `onDelete: Cascade` on `Doctor`. Deleting a doctor via API or database automatically purges all linked locations, services, conversations, messages, appointments, FAQs, and AI usage logs.
- **No Residual Data**: Doctor A's deletion leaves Doctor B's data 100% intact.

---

## 6. System Implementation Matrix

| Feature | Status | Details |
| :--- | :--- | :--- |
| Doctor-Centric Multi-Tenancy | **ALREADY IMPLEMENTED** | Scoped via `doctorId` across all models. |
| Egyptian Arabic & Arabizi Normalization | **ALREADY IMPLEMENTED** | Custom text normalizer in `src/lib/arabic.ts`. |
| Booking State Machine | **ALREADY IMPLEMENTED** | Interactive 5-step flow in `src/lib/state-machine.ts`. |
| Dynamic LLM Prompt Generator | **ALREADY IMPLEMENTED** | Injects doctor profile & prices in `src/lib/llm.ts`. |
| Emergency Symptom Detector | **ALREADY IMPLEMENTED** | Escalates chest pain / severe bleeding in `src/lib/medical-safety.ts`. |
| Interactive WhatsApp Simulator | **ALREADY IMPLEMENTED** | Doctor selection UI in `/simulator`. |
| Multi-Branch Location Manager | **ALREADY IMPLEMENTED** | `Location` model & UI in `/doctors`. |
| Meta WhatsApp Cloud API Client | **ALREADY IMPLEMENTED** | Webhook parser & sender in `src/lib/whatsapp.ts`. |
| Meta Business Account Registration | **MANUAL EXTERNAL SETUP** | Owner creates Meta Business Account & obtains Access Token. |
| Google Calendar API OAuth | **MANUAL EXTERNAL SETUP** | Owner connects doctor's Google Service Account JSON. |
