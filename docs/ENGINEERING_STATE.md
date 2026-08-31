# 🏗️ Tabibi AI — Engineering State & Architecture Record

---

## 1. Architecture Overview
- **Framework**: Next.js 14 (App Router, Server Actions / API Routes, React 18 client components).
- **Language**: TypeScript (`strict` mode enabled, 0 compilation errors via `tsc --noEmit`).
- **Database Layer**:
  - **Local Development**: SQLite (`dev.db` via `file:./dev.db`).
  - **Production Deployment**: Neon PostgreSQL (`ep-frosty-truth-aen4x8bo-pooler.c-2.us-east-2.aws.neon.tech`).
  - **Dynamic Provider Switcher**: [`scripts/prebuild.js`](file:///C:/Users/USER/tabibi-whatsapp-clinic/scripts/prebuild.js) mutates `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma` automatically during Vercel builds.
  - **Auto Schema & Seeding**: [`scripts/seed-if-empty.js`](file:///C:/Users/USER/tabibi-whatsapp-clinic/scripts/seed-if-empty.js) executes `prisma db push` and initializes default Super Admin and Doctor accounts if database is fresh.
- **Authentication & Authorization**:
  - Stateless JWT stored in HTTP-Only, Secure, SameSite=Lax cookie (`tabibi_session`).
  - Session verification in [`src/lib/auth.ts`](file:///C:/Users/USER/tabibi-whatsapp-clinic/src/lib/auth.ts) allows `ACTIVE`, `PENDING_ONBOARDING`, and `PENDING_APPROVAL` statuses, while strictly blocking `SUSPENDED` or `DISABLED` accounts.
  - Role-based routing handled by [`src/middleware.ts`](file:///C:/Users/USER/tabibi-whatsapp-clinic/src/middleware.ts) (`SUPER_ADMIN` -> `/admin`, `STAFF` -> `/staff`, `DOCTOR` -> `/doctor`).
- **Multi-Tenant Isolation**:
  - Strict `doctorId` foreign key scoping across all tenant domain models (`Patient`, `Appointment`, `Service`, `Location`, `Conversation`, `Message`, `DoctorSettings`, `Subscription`, `AuditLog`).
  - Server-side IDOR authorization helper `isDoctorAccessAllowed(session, targetDoctorId)` enforced on all API routes.
- **WhatsApp Cloud API Integration**:
  - Direct Meta WhatsApp Cloud API webhooks (`GET /api/whatsapp/webhook` for verification, `POST` for inbound patient messages).
  - WAMID idempotency deduplication via `db.message.findFirst({ where: { whatsappId } })`.
  - Multi-tenant tenant resolution via `resolveDoctorFromWhatsAppPayload()`.
- **AI Conversational Engine**:
  - OpenAI GPT-4o-mini engine with Egyptian Arabic system prompt, medical safety guardrails, intent detection (`BOOK_APPOINTMENT`, `RESCHEDULE`, `CANCEL`, `PRICE_INQUIRY`, `LOCATION_INQUIRY`, `WORKING_HOURS`, `HUMAN_HANDOFF`), and automated fallback handlers.
  - Token and cost tracking saved to `AiUsageLog`.

---

## 2. Production Environment & Live Credentials
- **GitHub Repository**: `https://github.com/elsaiedhany/tabibi-ai.git` (Branch: `master`).
- **Vercel Production Domain**: `https://tabibi-ai.vercel.app`
- **Default Accounts**:
  - **Super Admin**: `elsaiedhany40@gmail.com` / `442007Hany`
  - **Doctor A**: `ahmed@clinic.com` / `password123`
  - **Doctor B**: `sara@tabibi.ai` / `password123`
  - **Staff**: `reception@clinic.com` / `password123`

---

## 3. Work Completed
- [x] **Registration Session Invalidation Bug Fix**: Resolved token rejection for new doctors completing onboarding.
- [x] **Cross-Platform PostgreSQL Provider Switcher**: Created `scripts/prebuild.js` for zero-friction dynamic schema generation.
- [x] **Neon DB Auto-Push & Seeding**: Automated `prisma db push` and `seed-if-empty.js` in Vercel build pipeline.
- [x] **Token Masking & UI Hardening**: Masked `whatsappAccessToken` and `whatsappVerifyToken` as `••••••••` in GET/PATCH API responses and removed hardcoded secrets from settings UI DOM.
- [x] **Super Admin Doctor List Bug Fix**: Fixed `GET /api/doctors` route logic so Super Admin receives complete list of all registered clinics and doctors.
- [x] **Email Dispatch Wire-Up**: Integrated `sendEmailNotification` in admin application approval and rejection endpoints.
- [x] **Live Production E2E Verification**: Verified real registration, onboarding, and login against `https://tabibi-ai.vercel.app`.
- [x] **Automated Test Suite**: 14 Vitest test suites (74 tests) passing with 100% success rate.

---

## 4. Work Remaining / Current Audit Scope
- [ ] Verify Human Handoff / Shared Inbox state transitions (`AI_HANDOFF` status, staff assignment, unread filters).
- [ ] Enforce AI Control Center server-side switches (`isAiEnabled`, business-hours mode, after-hours messages).
- [ ] Review Appointment Engine concurrency and status lifecycle (`SCHEDULED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`).
- [ ] Verify Receptionist Operations & Doctor Dashboard metrics (ensuring all metrics are derived from real DB queries).
- [ ] Audit Subscription Engine server-side enforcement across all tenant endpoints.
- [ ] Validate Medical Safety boundaries (ensuring AI receptionist never provides diagnostic or prescription advice).
- [ ] Document Backup & Recovery procedures.

---

## 5. Test & Deployment Status
- **Static Types (`npx tsc --noEmit`)**: Clean (0 errors).
- **Linter (`npm run lint`)**: Passed.
- **Vitest Test Suite (`npm run test`)**: 14/14 test files passed (74/74 tests).
- **Production Build (`npm run build`)**: Succeeded in 33 seconds.
- **Production Health Check (`GET https://tabibi-ai.vercel.app/api/health`)**: Status `WARNING` (alert for unconfigured Meta WhatsApp tokens), Database `HEALTHY`, active doctors `2`, response time `267ms`.

---

## 6. Important Design Decisions
1. **Dynamic Prisma Schema Switcher**: Kept SQLite schema for local developer velocity while dynamically generating PostgreSQL schema during serverless CI/CD.
2. **Strict Server-Side Tenant Authorization**: Relying on server-side `isDoctorAccessAllowed()` helper rather than client-side state or hidden UI routes.
3. **WAMID Message Deduplication**: Webhooks check existing `whatsappId` in `Message` model to guarantee idempotent processing.
4. **Subscription Status Enforcement**: `getDoctorSubscriptionStatus(doctorId)` blocks write operations (like appointment booking) with `402 Payment Required` if the clinic subscription is expired or suspended.
