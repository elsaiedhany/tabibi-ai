# 🏛️ Tabibi AI (طبيبي) — System Architecture Specification

> **Platform**: Multi-Tenant WhatsApp Clinic SaaS  
> **Tech Stack**: Next.js 14 (App Router), TypeScript, Prisma ORM, SQLite / PostgreSQL, Tailwind CSS, OpenAI GPT-4o-mini, Vitest.

---

## 1. System Topology

```
                  ┌───────────────────────────────────────────────┐
                  │       Meta WhatsApp Cloud API Webhook         │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │    POST /api/whatsapp/webhook Engine          │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │  Multi-Tenant Doctor Resolution (phone_id)    │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │   13-Step Message Processor Pipeline          │
                  │   (Safety ➔ Intent ➔ Memory ➔ Rules ➔ LLM)    │
                  └───────────────────────┬───────────────────────┘
                                          │
                                          ▼
                  ┌───────────────────────────────────────────────┐
                  │ Prisma ORM (Strict Tenant Data Scoping)       │
                  └───────────────────────────────────────────────┘
```

---

## 2. Security & Tenant Scoping Rules

1. Every database query filters by `doctorId`.
2. Server-side API authentication checks JWT session cookie `tabibi_session`.
3. Account suspension check is performed against live database state.
4. Passwords hashed with `bcryptjs`.
5. Access tokens masked in client payloads.
