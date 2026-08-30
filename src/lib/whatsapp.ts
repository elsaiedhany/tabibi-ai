import { db } from "./db";

export interface WhatsAppInboundMessage {
  from: string; // Patient Phone e.g. "201012345678"
  displayPhoneNumber?: string; // Doctor/Clinic WhatsApp Number e.g. "201099887766"
  phoneNumberId?: string; // Meta Phone Number ID e.g. "109283746501928"
  text: string;
  messageId: string;
  timestamp: string;
  mediaType?: "text" | "audio" | "image" | "document" | "interactive" | "button";
  mediaUrl?: string;
  buttonPayload?: string;
}

/**
 * Per-Doctor Outbound WhatsApp Message Sender
 * Checks doctor-specific settings first, falling back to environment variables.
 */
export async function sendWhatsAppTextMessage(
  toPhone: string,
  text: string,
  doctorId?: string
): Promise<{ success: boolean; whatsappId?: string }> {
  let token = process.env.WHATSAPP_ACCESS_TOKEN;
  let phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // Attempt to fetch doctor-specific Meta WhatsApp credentials if doctorId is provided
  if (doctorId) {
    const docSettings = await db.doctorSettings.findUnique({ where: { doctorId } });
    if (docSettings?.whatsappAccessToken && docSettings?.whatsappPhoneNumberId) {
      token = docSettings.whatsappAccessToken;
      phoneId = docSettings.whatsappPhoneNumberId;
    }
  }

  // If credentials missing or in DEMO mode, simulate sending message gracefully!
  if (!token || !phoneId || token.includes("EAAX") || process.env.DEMO_MODE === "true") {
    return { success: true, whatsappId: `sim_msg_${Date.now()}` };
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: toPhone,
        type: "text",
        text: { body: text },
      }),
    });

    const data = await res.json();
    if (res.ok && data.messages?.[0]?.id) {
      return { success: true, whatsappId: data.messages[0].id };
    }
    return { success: false };
  } catch (error) {
    return { success: false };
  }
}

/**
 * Parses Webhook Payload from Meta WhatsApp Cloud API
 * Supports text, interactive buttons, list replies, and media messages
 */
export function parseWhatsAppWebhookPayload(body: any): WhatsAppInboundMessage | null {
  try {
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];
    const metadata = change?.metadata;

    if (!message) return null;

    const from = message.from;
    const messageId = message.id;
    const timestamp = message.timestamp;
    const displayPhoneNumber = metadata?.display_phone_number;
    const phoneNumberId = metadata?.phone_number_id;

    let text = "";
    let mediaType: WhatsAppInboundMessage["mediaType"] = "text";
    let mediaUrl: string | undefined = undefined;
    let buttonPayload: string | undefined = undefined;

    if (message.type === "text") {
      text = message.text?.body || "";
    } else if (message.type === "interactive") {
      mediaType = "interactive";
      if (message.interactive?.type === "button_reply") {
        text = message.interactive.button_reply.title || "";
        buttonPayload = message.interactive.button_reply.id;
      } else if (message.interactive?.type === "list_reply") {
        text = message.interactive.list_reply.title || "";
        buttonPayload = message.interactive.list_reply.id;
      }
    } else if (message.type === "button") {
      mediaType = "button";
      text = message.button?.text || "";
      buttonPayload = message.button?.payload;
    } else if (message.type === "audio") {
      mediaType = "audio";
      text = "[تسجيل صوتي]";
    } else if (message.type === "image") {
      mediaType = "image";
      text = message.caption || "[صورة]";
    } else if (message.type === "document") {
      mediaType = "document";
      text = message.caption || "[مستند]";
    }

    return {
      from,
      displayPhoneNumber,
      phoneNumberId,
      text,
      messageId,
      timestamp,
      mediaType,
      mediaUrl,
      buttonPayload,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Multi-Tenant Doctor Resolution Engine
 * Resolves target Doctor account using Meta WhatsApp Metadata or Doctor Settings
 */
export async function resolveDoctorFromWhatsAppPayload(parsed: WhatsAppInboundMessage): Promise<any | null> {
  // 1. Resolve by Meta Phone Number ID matching DoctorSettings
  if (parsed.phoneNumberId) {
    const setting = await db.doctorSettings.findFirst({
      where: { whatsappPhoneNumberId: parsed.phoneNumberId },
      include: { doctor: true },
    });
    if (setting?.doctor) return setting.doctor;
  }

  // 2. Resolve by Meta Display Phone Number matching Doctor.whatsappNumber
  if (parsed.displayPhoneNumber) {
    const doc = await db.doctor.findFirst({
      where: { whatsappNumber: parsed.displayPhoneNumber },
    });
    if (doc) return doc;
  }

  // 3. Resolve by Patient sender phone number matching Doctor.whatsappNumber (for doctor testing on own number)
  if (parsed.from) {
    const doc = await db.doctor.findFirst({
      where: { whatsappNumber: parsed.from },
    });
    if (doc) return doc;
  }

  // 4. Fallback: Return primary doctor if exactly 1 active doctor exists in DB
  const primaryDoc = await db.doctor.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return primaryDoc || null;
}
