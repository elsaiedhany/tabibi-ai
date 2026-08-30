# 🏥 Tabibi AI (طبيبي) - Commercial WhatsApp AI Receptionist & Clinic Automation Platform

**Tabibi AI** is a production-ready, multi-tenant AI WhatsApp Receptionist & Clinic Automation System engineered specifically for Egyptian medical clinics.

Designed to be sold as a SaaS product (15,000–20,000+ EGP per clinic package), Tabibi AI enables deploying identical software for multiple clinics through dynamic database configuration without changing source code.

---

## 🌟 Core Value & Capabilities

- 🤖 **Deterministic First, AI Last**: Resolves 60–80% of routine Egyptian Arabic patient interactions (greetings, prices, working hours, address, doctor list, booking, rescheduling, cancellations) via zero-cost code rules, state machines, and FAQ cache before triggering an LLM.
- 🇪🇬 **Egyptian Arabic & Franco / Arabizi Support**: Built-in text normalizer handling tashkeel removal, Egyptian slang (`عايز احجز`, `الكشف بكام`, `فين العيادة`), and Arabizi (`3ayez a7gez`, `kashf`, `doctor`).
- 📅 **Conflict-Free Appointment Booking**: Real-time slot availability check, double-booking prevention, and optional Google Calendar sync.
- 🚨 **Medical Safety Guardrail**: Strict receptionist role enforcement. Detects emergency symptoms (`ألم في الصدر`, `ضيق تنفس`, `نزيف`) -> outputs immediate emergency guidance (Call 123 / Hospital) and triggers human escalation. Never provides medical diagnoses or prescriptions.
- 👨‍💼 **Live Human Handoff & Takeover**: Real-time staff notification, toggle between AI-active and receptionist manual chat.
- 📱 **Interactive WhatsApp Simulator**: Built-in live phone UI in the dashboard allowing complete demonstration and testing without needing real Meta API credentials!
- 📊 **AI Cost Optimization Analytics**: Tracks token consumption, model complexity routing (`gpt-4o-mini` / `gpt-4o`), estimated cost ($), and total money saved.
- 🔄 **Self-Optimization**: Single-click conversion of repeatedly asked patient questions into deterministic FAQ entries.

---

## 🏗 Tech Stack & Architecture

- **Frontend & Backend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS with Arabic RTL support & Cairo typography, Lucide Icons.
- **Database & ORM**: Prisma ORM, SQLite (local zero-setup dev) / PostgreSQL (production containerized).
- **Authentication**: JWT-based session auth with role checks (`SUPER_ADMIN`, `CLINIC_ADMIN`, `RECEPTIONIST`), bcrypt password hashing, multi-tenant `clinic_id` data isolation.
- **Automation & Workflows**: n8n workflows (`n8n/workflows/`).
- **Integrations**: Meta WhatsApp Cloud API, OpenAI API, Google Calendar.

---

## 🚀 Quick Start (Local Demo Mode)

### 1. Prerequisites
- Node.js v18+ & npm
- Git

### 2. Installation & Setup
```bash
# Clone or enter directory
cd tabibi-whatsapp-clinic

# Install dependencies
npm install

# Run database setup & seed demo clinic data
npx prisma db push
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Access Credentials

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@tabibi.ai` | `password123` | Multi-clinic management, platform settings & analytics |
| **Clinic Admin** | `ahmed@clinic.com` | `password123` | Clinic settings, doctors, services, FAQs, AI budget |
| **Receptionist** | `reception@clinic.com` | `password123` | Live chat takeover, appointments management |

---

## 🐳 Production Docker Deployment

```bash
# Set environment variables in .env
cp .env.example .env

# Run docker-compose
docker-compose up -d --build
```

Services started:
- `app`: Next.js Web App & API (`http://localhost:3000`)
- `postgres`: PostgreSQL database (`5432`)
- `redis`: Redis cache (`6379`)
- `n8n`: n8n Workflow Automation (`http://localhost:5678`)

---

## 🧪 Testing

Run unit & integration test suite:
```bash
npm run test
```
Tests cover Arabic normalization, Franco conversion, deterministic intent routing, and medical safety guardrails.
