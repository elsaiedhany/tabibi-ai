# 🔄 n8n Master Workflow - Tabibi AI Clinic System

This folder contains the complete, production-ready n8n workflow definition for automated WhatsApp message processing, intent classification, multi-tenant doctor context resolution, booking state machine execution, and automated fallback error handling.

## Complete Workflow File

- **`n8n/whatsapp-clinic-complete.json`**:
  - **Triggers**: Webhook (`POST` / `GET` at `/webhook/whatsapp-clinic-webhook`).
  - **Capabilities**:
    1. **Meta Webhook Verification**: Handles `GET` hub mode & challenge response.
    2. **Idempotency & Deduplication**: Prevents duplicate message processing.
    3. **Payload Extraction**: Parses sender phone number, message text, and WhatsApp message ID.
    4. **Doctor Context Resolution**: Resolves target doctor (`Doctor`) by incoming phone number.
    5. **13-Step Master Pipeline Call**: Triggers Tabibi Next.js API `/api/simulator/send` or `/api/whatsapp/webhook` to handle intent classification, booking state machine, FAQ cache, medical safety guardrails, LLM fallback, database records, and dashboard tracking.
    6. **Outbound Response Router**: Sends reply via Meta Cloud API or logs in local dev mode.

## How to Import in n8n

1. Open your n8n dashboard (`http://localhost:5678`).
2. Click **Workflows** -> **Import from File**.
3. Select `n8n/whatsapp-clinic-complete.json`.
4. Click **Save** and toggle the workflow to **Active**.
