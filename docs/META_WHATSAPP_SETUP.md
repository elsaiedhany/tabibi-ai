# 📱 Meta WhatsApp Cloud API Setup Guide

> **Scope**: Connecting a Doctor's WhatsApp Business Phone Number to Tabibi AI  
> **Architecture**: Official Meta WhatsApp Cloud API (Graph API v19.0+)

---

## 1. Feature Status Matrix

| Component | Status | Details |
| :--- | :--- | :--- |
| **Inbound Webhook Verification (`GET /api/whatsapp/webhook`)** | **ALREADY IMPLEMENTED** | Validates `hub.mode`, `hub.verify_token`, and returns `hub.challenge`. |
| **Inbound Message Webhook Receiver (`POST /api/whatsapp/webhook`)** | **ALREADY IMPLEMENTED** | Parses incoming text/media messages and routes to tenant processor. |
| **Outbound Message Sender (`src/lib/whatsapp.ts`)** | **ALREADY IMPLEMENTED** | Formats and sends HTTP POST to `https://graph.facebook.com/v19.0/{phone_number_id}/messages`. |
| **Interactive Simulator (`/simulator`)** | **ALREADY IMPLEMENTED** | Simulates Meta Cloud API webhooks directly inside browser UI. |
| **Meta Business Manager Account Registration** | **MANUAL EXTERNAL SETUP** | Owner creates Meta App & obtains System User Permanent Token. |
| **Meta Phone Number Verification (OTP)** | **MANUAL EXTERNAL SETUP** | Doctor receives SMS/Voice OTP from Meta to verify business phone number. |

---

## 2. Step-by-Step Meta Setup Instructions

### Step 1: Create Meta Developer App
1. Log into [Meta Developer Portal](https://developers.facebook.com/).
2. Click **Create App** ➔ Select Type: **Business**.
3. App Name: `Tabibi AI - Doctor Receptionist`.
4. Add Product: Select **WhatsApp** ➔ Click **Set up**.

### Step 2: Add & Verify Doctor's Phone Number
1. Under WhatsApp ➔ API Setup, click **Add Phone Number**.
2. Input Doctor's Business Phone Number (e.g. `+20 101 234 5678`).
3. Select verification method: **SMS** or **Voice Call**.
4. Input the 6-digit OTP code received by doctor to complete verification.
5. Copy the generated **Phone Number ID** (e.g. `109283746501928`).

### Step 3: Generate System User Permanent Access Token
1. Go to Business Settings ➔ System Users ➔ Click **Add**.
2. Role: **Admin**.
3. Assign Assets: Select your WhatsApp App ➔ Grant `whatsapp_business_messaging` and `whatsapp_business_management` permissions.
4. Click **Generate Token** (select Never Expire).
5. Copy the generated **System User Access Token**.

### Step 4: Configure Webhook Endpoint
1. In Meta Developer Portal ➔ WhatsApp ➔ Configuration:
   - **Callback URL**: `https://your-domain.com/api/whatsapp/webhook`
   - **Verify Token**: Set matching string from `.env` (default: `tabibi_webhook_verify_secret`).
2. Click **Verify and Save**.
3. Under Webhook Fields, subscribe to **`messages`**.

### Step 5: Save Credentials in Tabibi Admin UI
1. Open Tabibi AI Dashboard ➔ `/settings`.
2. Select target Doctor.
3. Paste:
   - **WhatsApp Phone Number ID**
   - **System User Permanent Access Token**
   - **Verify Token**
4. Click **Save Settings**.

---

## 3. Webhook Security & Tenant Resolution

When Meta fires a webhook payload to `/api/whatsapp/webhook`:
1. System validates payload signature.
2. Extracts sender phone number (`parsed.from`).
3. Performs instant database resolution:
   ```ts
   const doctor = await db.doctor.findFirst({
     where: { whatsappNumber: parsed.from }
   });
   ```
4. Loads Doctor A's configuration, active state machine, FAQ cache, and prompt settings.
5. Sends automated reply using Doctor A's configured `whatsappPhoneNumberId` and `whatsappAccessToken`.
