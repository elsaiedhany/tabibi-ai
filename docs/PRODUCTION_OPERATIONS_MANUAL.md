# 🏥 Tabibi AI (طبيبي) — Production Operations, Fault Tolerance & Clinic Pilot Manual

> **Product**: Tabibi AI WhatsApp Receptionist  
> **Repository**: `C:\Users\USER\tabibi-whatsapp-clinic`  
> **Target Audience**: Platform Owner, System Administrator & Sales Engineers  
> **Status**: **REAL-WORLD CLINIC OPERATIONAL MANUAL**

---

## 1. Real-World WhatsApp Cloud API Resilience

| Potential Failure Point | System Defense Architecture | Code Implementation |
| :--- | :--- | :--- |
| **Duplicate Webhook Payload (WAMID Duplicate)** | WAMID Idempotency check in DB. If `whatsappId` exists, returns HTTP 200 `{ status: "ignored_duplicate" }`. | [`src/app/api/whatsapp/webhook/route.ts`](file:///C:/Users/USER/tabibi-whatsapp-clinic/src/app/api/whatsapp/webhook/route.ts#L33) |
| **Concurrent Messages from Same Patient** | Message Processor locks conversation state and processes messages sequentially. | [`src/lib/message-processor.ts`](file:///C:/Users/USER/tabibi-whatsapp-clinic/src/lib/message-processor.ts) |
| **Unregistered WhatsApp Number** | Dynamic Doctor Resolution Engine (`resolveDoctorFromWhatsAppPayload`) checks `phone_number_id` and `display_phone_number`. If no doctor matches, logs audit warning and returns HTTP 404 without leaking data. | [`src/lib/whatsapp.ts`](file:///C:/Users/USER/tabibi-whatsapp-clinic/src/lib/whatsapp.ts#L106) |
| **Outbound WhatsApp API Failure** | If Meta Graph API returns HTTP error or fails network connection, message status is set to `failed` and logged to `AuditLog`. The appointment remains safe in DB. | [`src/lib/whatsapp.ts`](file:///C:/Users/USER/tabibi-whatsapp-clinic/src/lib/whatsapp.ts#L44) |

---

## 2. Booking Engine Concurrency & Double Booking Safety

- **Atomic Availability Checks**: Before creating an appointment, `isSlotAvailable(doctorId, date, time)` queries DB for active (`SCHEDULED`) appointments.
- **Walk-in Receptionist Bookings**: The receptionist can manually add a walk-in patient from `/appointments` in 10 seconds.
- **Cancellation & Rescheduling**: Changing or cancelling an appointment updates the status to `CANCELLED` or `RESCHEDULED`, freeing up the slot for other patients immediately.

---

## 3. Fault Tolerance & Fallback Matrix

```
                          ┌───────────────────────────┐
                          │   Incoming Webhook Event  │
                          └─────────────┬─────────────┘
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             │                          │                          │
             ▼                          ▼                          ▼
   [Meta Webhook Downtime]      [OpenAI API Timeout]      [Database Connection Fail]
             │                          │                          │
             ▼                          ▼                          ▼
  Retry queue via n8n /       Fallback to Fast Rule     Return HTTP 500 cleanly,
  HTTP 200 response retry     Templates / Egyptian      alert Super Admin via
  by Meta Cloud API           Fallback Response          `/api/health` monitoring
```

---

## 4. Sensitive Data Privacy & Database Backup Protocol

### Data Privacy & Encryption
1. **Token Masking**: Access tokens are masked as `"••••••••"` in API responses (`GET /api/settings`).
2. **Sanitized Logs**: No passwords, access tokens, or sensitive patient medical records are printed in server console logs.
3. **Role-Based Access Control**: Receptionists can only access data for their assigned doctor (`doctorId`).

### Automated Database Backup Script (Daily Backup)
For SQLite / PostgreSQL production setups, run a daily backup cron:
```bash
# SQLite Production Backup Command
cp prisma/dev.db backups/tabibi_db_$(date +%Y%m%d_%H%M%S).db

# PostgreSQL Backup Command
pg_dump -U tabibi_user tabibi_db > backups/tabibi_pg_$(date +%Y%m%d_%H%M%S).sql
```

---

## 5. Doctor Onboarding Protocol (10-15 Minutes Total Setup)

```
Step 1: Create Doctor Record in Dashboard (/doctors)                     ➔ 2 mins
Step 2: Enter Meta Phone Number ID & Access Token (/settings)            ➔ 3 mins
Step 3: Set Consultation Price & Working Hours                           ➔ 2 mins
Step 4: Register Meta Webhook URL (https://your-domain.com/api/whatsapp) ➔ 3 mins
Step 5: Test Greeting & Booking on Simulator (/simulator)                ➔ 2 mins
----------------------------------------------------------------------------------
TOTAL TIME TO GO LIVE:                                                    12 mins
```

---

## 6. Real-World 1-Week Clinic Pilot Strategy (7-Day Trial Protocol)

Before offering Tabibi AI to dozens of clinics, execute a **Single-Clinic 7-Day Real Pilot**:

### Pilot Setup Phase (Day 0)
- Select 1 friendly doctor (e.g. Dermatology or Dental clinic in Cairo).
- Onboard doctor's WhatsApp number and configure reception staff accounts.
- Train receptionist for 15 minutes on using `/appointments` and `/patients`.

### Real Operations Monitoring Phase (Days 1–7)
- **Day 1**: Monitor incoming patient messages live via `/conversations`. Verify AI replies.
- **Day 3**: Check reminder delivery rates on `/reminders`.
- **Day 5**: Review receptionist feedback on manual walk-in bookings.
- **Day 7**: Audit system performance, AI budget usage (`/api/health`), and receptionist satisfaction.

If 0 critical errors occur during the 7-day pilot, the platform is officially ready for commercial enterprise scaling!
