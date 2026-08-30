# 📱 Meta WhatsApp Cloud API — Production Setup & Technical Guide

> **Target Platform**: Meta WhatsApp Cloud API (Graph API v19.0)  
> **Repository**: `C:\Users\USER\tabibi-whatsapp-clinic`  
> **Status**: **PRODUCTION-READY ARCHITECTURE**

---

## 1. Meta Developer App & WhatsApp Business Setup Steps

### Step 1: Create Meta Developer App
1. Go to [developers.facebook.com](https://developers.facebook.com/) and log in with your Facebook Business Account.
2. Click **Create App** ➔ Select App Type: **Business**.
3. Enter App Name (e.g. `Tabibi AI Receptionist`) and link your Business Manager.
4. Under **Add Products to App**, click **Set Up** on **WhatsApp**.

### Step 2: Add WhatsApp Business Phone Number
1. Navigate to **WhatsApp ➔ API Setup** in the left sidebar.
2. Under **Step 5: Add a phone number**, click **Add Phone Number**.
3. Fill in Doctor/Clinic Profile:
   - **Display Name**: e.g., `د. أحمد محمد - عيادة الجلدية`
   - **Category**: `Medical & Health`
4. Enter the Doctor's phone number and complete 6-digit SMS/Voice OTP verification.
5. Copy the generated **Phone Number ID** (e.g. `109283746501928`) and **WhatsApp Business Account ID**.

### Step 3: Generate Permanent System User Access Token
1. Go to **Meta Business Settings** (`business.facebook.com/settings`) ➔ **System Users**.
2. Click **Add** ➔ Role: **Admin**.
3. Click **Assign Assets** ➔ Add your WhatsApp App with full control.
4. Click **Generate New Token** ➔ Select permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Copy the generated permanent token (`EAAX...`).

### Step 4: Configure Meta Webhook
1. Go to **WhatsApp ➔ Configuration** in Meta Developer Console.
2. Click **Edit Webhook**.
3. Enter Callback URL:
   - **Production**: `https://your-domain.com/api/whatsapp/webhook`
   - **n8n Workflow**: `https://your-domain.com/webhook/whatsapp-clinic-webhook`
4. Enter Verify Token matching `WHATSAPP_VERIFY_TOKEN` (e.g. `tabibi_webhook_verify_secret`).
5. Click **Verify and Save**.
6. Under Webhook fields, click **Subscribe** on **`messages`**.

---

## 2. Environment Variables & Required Credentials Matrix

```env
# Meta WhatsApp Cloud API Credentials (Server-Side Only)
WHATSAPP_ACCESS_TOKEN="EAAX..."                       # Permanent System User Token
WHATSAPP_PHONE_NUMBER_ID="109283746501928"             # Meta Phone Number ID
WHATSAPP_VERIFY_TOKEN="tabibi_webhook_verify_secret"   # Webhook Secret Verification Token
TABIBI_API_URL="http://localhost:3000"                 # Tabibi Backend API Endpoint
```

---

## 3. Webhook Verification & Outbound Flow

### Webhook Verification (`GET /api/whatsapp/webhook`)
When Meta verifies your webhook, it sends a `GET` request:
```text
GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=tabibi_webhook_verify_secret&hub.challenge=115820120
```
Tabibi verifies `hub.verify_token` and returns `hub.challenge` text with HTTP 200.

### Outbound Response (`sendWhatsAppTextMessage`)
Outbound messages are delivered via Meta Graph API:
```text
POST https://graph.facebook.com/v19.0/{{PHONE_NUMBER_ID}}/messages
Headers: Authorization: Bearer {{ACCESS_TOKEN}}
Body: { "messaging_product": "whatsapp", "to": "201012345678", "type": "text", "text": { "body": "أهلاً بك!" } }
```

---

## 4. Production Checklist Before Live Launch

- [x] Next.js API Routes & Middleware verified (`npx next build` -> 0 errors).
- [x] Multi-Tenant Doctor Resolution by Phone Number & Meta ID.
- [x] WAMID Idempotency deduplication check.
- [x] WAMID test suite (`npx vitest run` -> 50/50 tests passed).
- [ ] Registered Meta Webhook URL with HTTPS certificate.
- [ ] Verified live Meta Access Token on doctor's WhatsApp number.
