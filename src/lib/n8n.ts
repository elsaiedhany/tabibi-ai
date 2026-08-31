import crypto from "crypto";

export interface N8nOrchestrationPayload {
  eventId: string;
  clinicId: string;
  doctorId: string;
  doctorName: string;
  conversationId: string;
  patientId: string;
  patientPhone: string;
  patientName?: string;
  whatsappMessageId: string;
  messageText: string;
  mediaType?: string;
  tenantConfiguration: {
    n8nWebhookUrl?: string | null;
    isAiEnabled: boolean;
    n8nEnabled: boolean;
    integrationStatus: string;
    customSystemPrompt?: string | null;
    workingHours: string;
    services: Array<{ name: string; price: number }>;
  };
  timestamp: string;
}

export interface N8nOrchestrationResponse {
  success: boolean;
  handledBy: "N8N_ORCHESTRATOR" | "BACKEND_FALLBACK";
  replyText?: string;
  intent?: string;
  suggestedAction?: {
    actionType: "BOOK_APPOINTMENT" | "CANCEL_APPOINTMENT" | "HANDOFF_TO_HUMAN" | "NONE";
    metadata?: Record<string, any>;
  };
  error?: string;
}

const N8N_SECRET = process.env.N8N_SHARED_SECRET || "tabibi_n8n_hmac_shared_secret_2026";

/**
 * Generates an HMAC SHA-256 signature for authenticating Tabibi Backend -> n8n requests.
 */
export function generateN8nSignature(rawBody: string, timestamp: string): string {
  const hmac = crypto.createHmac("sha256", N8N_SECRET);
  hmac.update(`${timestamp}.${rawBody}`);
  return hmac.digest("hex");
}

/**
 * Cryptographically verifies an incoming X-Tabibi-Signature against N8N_SHARED_SECRET.
 */
export function verifyN8nSignature(rawBody: string, timestamp: string, signatureHeader: string): boolean {
  if (!timestamp || !signatureHeader) return false;

  const parts = signatureHeader.split(",");
  const v1Part = parts.find((p) => p.trim().startsWith("v1="));
  if (!v1Part) return false;

  const providedSignature = v1Part.trim().replace("v1=", "");
  const expectedSignature = generateN8nSignature(rawBody, timestamp);

  try {
    const providedBuffer = Buffer.from(providedSignature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    if (providedBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
  } catch (_) {
    return false;
  }
}

/**
 * Dispatches WhatsApp event to n8n dynamic workflow orchestrator with HMAC authentication & 5s timeout.
 */
export async function dispatchToN8nOrchestrator(payload: N8nOrchestrationPayload): Promise<N8nOrchestrationResponse> {
  const targetWebhookUrl = payload.tenantConfiguration.n8nWebhookUrl || process.env.N8N_WEBHOOK_URL;

  if (!payload.tenantConfiguration.n8nEnabled || !targetWebhookUrl) {
    return { success: false, handledBy: "BACKEND_FALLBACK" };
  }

  const rawBody = JSON.stringify(payload);
  const timestamp = payload.timestamp;
  const signature = generateN8nSignature(rawBody, timestamp);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(targetWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tabibi-Timestamp": timestamp,
        "X-Tabibi-Signature": `t=${timestamp},v1=${signature}`,
      },
      body: rawBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`⚠️ n8n Orchestrator returned HTTP ${response.status}: ${response.statusText}`);
      return { success: false, handledBy: "BACKEND_FALLBACK", error: `HTTP ${response.status}` };
    }

    const resData = await response.json();

    // Validate Response Contract Schema: Must be an object containing non-empty replyText string
    if (!resData || typeof resData !== "object" || typeof resData.replyText !== "string" || !resData.replyText.trim()) {
      console.warn("⚠️ n8n Orchestrator returned malformed response payload:", resData);
      return { success: false, handledBy: "BACKEND_FALLBACK", error: "MALFORMED_N8N_RESPONSE" };
    }

    return {
      success: true,
      handledBy: "N8N_ORCHESTRATOR",
      replyText: resData.replyText.trim(),
      intent: resData.intent || "GENERAL_INQUIRY",
      suggestedAction: resData.suggestedAction || { actionType: "NONE" },
    };
  } catch (err: any) {
    console.error("⚠️ n8n Orchestration Dispatch Error / Timeout:", err.message);
    return { success: false, handledBy: "BACKEND_FALLBACK", error: err.message };
  }
}
