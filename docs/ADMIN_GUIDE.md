# 👑 Tabibi AI — Super Admin Manual

> **User Role**: `SUPER_ADMIN`  
> **Default Credentials**: `elsaiedhany40@gmail.com`

---

## Operations Overview

1. **Adding a New Doctor**:
   - Navigate to **"إدارة الأطباء والحسابات"** (`/doctors`).
   - Click **"+ إضافة طبيب جديد"**.
   - Fill in Doctor Name, Specialty, WhatsApp Phone Number, Consultation Price.

2. **Configuring Meta WhatsApp Credentials**:
   - Open Doctor Settings (`/settings`).
   - Enter **Phone Number ID**, **Permanent Access Token**, and **Verify Token**.
   - Access tokens are automatically masked in the UI.

3. **System Health Monitoring**:
   - Access `GET /api/health` to review active doctors, today's appointments, AI usage costs, and system alerts.
