# 📋 Tabibi AI (طبيبي) — Client Onboarding & Isolation Manual

> **Purpose**: Practical guide for onboarding a new paying doctor step-by-step, ensuring 100% data isolation and zero technical confusion for the client.

---

## 1. Non-Technical Onboarding Philosophy

The doctor is buying an **outcome**: a 24/7 smart receptionist that increases bookings and reduces missed calls.

The doctor must **NEVER** be exposed to:
- n8n workflows
- OpenAI API keys
- PostgreSQL / SQLite database queries
- Docker containers or command line terminals
- Code or JSON configuration

All technical setups are performed by the platform owner/admin using the simple admin interface.

---

## 2. Complete 14-Step Onboarding Workflow

| Step | Stage | Action Performed by Platform Owner | UI Route / Tool |
| :---: | :--- | :--- | :--- |
| **1** | **Payment Confirmation** | Collect initial setup fee & monthly subscription contract. | External / Bank Transfer |
| **2** | **Collect Data Form** | Send copy/paste onboarding form (`doctor-onboarding-checklist.md`). | WhatsApp / Email |
| **3** | **Create Account** | Open `/doctors` ➔ Click **"+ إضافة طبيب جديد"** ➔ Input name, specialty, WhatsApp #, consultation price. | `/doctors` |
| **4** | **Basic Profile Setup** | Fill doctor title, experience years, bio, gender, and contact phone. | `/doctors` |
| **5** | **Services & Prices** | Add specific treatments (e.g. Laser, Botox, Veneers, Root Canal) with prices & duration. | `/services` |
| **6** | **Working Hours** | Configure official clinic schedule (e.g. `السبت إلى الخميس: 4:00 مساءً - 10:00 مساءً`). | `/doctors` |
| **7** | **Branch Locations** | Add primary and secondary clinic addresses with Google Maps links. | `/doctors` |
| **8** | **WhatsApp Webhook** | Register doctor's Meta WhatsApp Phone Number ID & Access Token in settings. | `/settings` |
| **9** | **Google Calendar** | Connect doctor's Google Calendar ID for live slot synchronization. | `/settings` |
| **10** | **Custom FAQs** | Insert 5–10 custom doctor FAQs (e.g. parking, preparation before laser/surgery). | `/faqs` |
| **11** | **AI Persona & Templates** | Set assistant name (`مريم`), tone (`EGYPTIAN_FRIENDLY`), greeting template. | `/settings` |
| **12** | **Simulator Validation** | Test greetings, prices, booking flow, emergency check, and handoff in simulator. | `/simulator` |
| **13** | **Go Live Activation** | Verify Meta Webhook status: `200 OK`. Toggle doctor `isActive` to true. | Meta Dashboard |
| **14** | **Handover & Staff Training** | Provide doctor & receptionist with login credentials to `/conversations` & `/appointments`. | Web Dashboard |

---

## 3. How Doctor Isolation Works (Multi-Tenancy Mechanics)

Every doctor operates inside a strict database partition identified by `doctorId`.

```
                  ┌─────────────────────────────────────────┐
                  │          Platform Admin System          │
                  └────────────────────┬────────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                │                                             │
                ▼                                             ▼
  ┌───────────────────────────┐                 ┌───────────────────────────┐
  │     Doctor A Partition    │                 │     Doctor B Partition    │
  ├───────────────────────────┤                 ├───────────────────────────┤
  │ • Doctor ID: doc_ahmed_123│                 │ • Doctor ID: doc_sara_999 │
  │ • WhatsApp: 201012345678  │                 │ • WhatsApp: 201099881122  │
  │ • Specialty: Dermatology  │                 │ • Specialty: Dentistry    │
  │ • Fee: 500 EGP            │                 │ • Fee: 600 EGP            │
  │ • Patients: Patient A List│                 │ • Patients: Patient B List│
  │ • Calendar: Cal_Ahmed_GSuite                │ • Calendar: Cal_Sara_GSuite│
  └───────────────────────────┘                 └───────────────────────────┘
```

### Strict Isolation Rules Enforced by System:
1. **Incoming Message Routing**: When a message arrives at `/api/whatsapp/webhook`, the system extracts `parsed.from` or `whatsappPhoneNumberId` and performs an exact lookup:
   ```ts
   const doctor = await db.doctor.findFirst({ where: { whatsappNumber: incomingPhone } });
   ```
   Message processing proceeds **exclusively** with `doctorId = doctor.id`.

2. **Database Queries Scoped**: Every database query filters by `doctorId`:
   ```ts
   const patients = await db.patient.findMany({ where: { doctorId: session.doctorId } });
   const appointments = await db.appointment.findMany({ where: { doctorId: session.doctorId } });
   ```

3. **Zero Data Leakage Guarantee**: Doctor A cannot access, query, or receive Doctor B's patients, appointments, conversations, prices, FAQs, or calendar entries under any circumstances.
