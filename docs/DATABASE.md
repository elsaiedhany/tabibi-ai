# 🗄️ Tabibi AI — Database Schema & Data Dictionary

> **ORM**: Prisma  
> **Database Engine**: SQLite (Dev/Local) / PostgreSQL (Production Docker)

---

## Key Models & Relationships

1. **Doctor (`doctors`)**: Primary SaaS Tenant.
2. **User (`users`)**: Authenticated user accounts linked via `DoctorUser`.
3. **Patient (`patients`)**: Scoped to `doctorId`. Unique on `[doctorId, whatsappNumber]`.
4. **Appointment (`appointments`)**: Scoped to `doctorId` & `patientId`.
5. **Conversation (`conversations`)**: Dialogue memory state machine.
6. **Message (`messages`)**: Message log with WAMID deduplication index `whatsappId`.
7. **DoctorSettings (`doctor_settings`)**: Per-doctor Meta credentials and template prompts.
8. **AiUsage (`ai_usage`)**: Token usage ledger per call.
9. **AuditLog (`audit_logs`)**: Security event log.
