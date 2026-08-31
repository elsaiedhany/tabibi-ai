import { NextRequest } from "next/server";
import { Receiver } from "@upstash/qstash";

export interface WhatsAppQueueJob {
  doctorId: string;
  patientPhone: string;
  rawText: string;
  mediaType?: string;
  whatsappMessageId: string;
  queuedAt: string;
}

const WORKER_SECRET = process.env.WORKER_SECRET_KEY || "tabibi_internal_worker_secret_key_2026";

/**
 * Publishes an incoming WhatsApp message processing job to the queue.
 * Supports Upstash QStash when QSTASH_TOKEN is configured, or resilient async worker dispatch.
 */
function getAppBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function publishWhatsAppWorkerJob(job: WhatsAppQueueJob): Promise<{ success: boolean; jobMode: "QSTASH" | "ASYNC_DISPATCH" | "SYNC_FALLBACK"; messageId: string }> {
  const appBaseUrl = getAppBaseUrl();
  const workerUrl = `${appBaseUrl}/api/whatsapp/worker`;

  const qstashToken = process.env.QSTASH_TOKEN;

  if (qstashToken) {
    try {
      const qstashRes = await fetch(`https://qstash.upstash.io/v2/publish/${workerUrl}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${qstashToken}`,
          "Content-Type": "application/json",
          "Upstash-Deduplication-Id": job.whatsappMessageId,
          "Upstash-Retries": "3",
        },
        body: JSON.stringify(job),
      });

      if (qstashRes.ok) {
        return { success: true, jobMode: "QSTASH", messageId: job.whatsappMessageId };
      }
    } catch (err) {
      console.error("⚠️ QStash publish failed, falling back to async worker dispatch:", err);
    }
  }

  // Resilient non-blocking async dispatch fallback (guarantees HTTP 200 webhook response in < 50ms)
  setImmediate(() => {
    fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WORKER_SECRET}`,
      },
      body: JSON.stringify(job),
    }).catch((err) => {
      console.error("⚠️ Async worker dispatch background fetch error:", err);
    });
  });

  return { success: true, jobMode: "ASYNC_DISPATCH", messageId: job.whatsappMessageId };
}

/**
 * Validates worker endpoint authorization via QStash Cryptographic Signature or Worker Bearer Secret.
 */
export async function verifyWorkerAuth(req: NextRequest): Promise<boolean> {
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  const signature = req.headers.get("upstash-signature");

  if (currentKey && nextKey && signature) {
    try {
      const receiver = new Receiver({
        currentSigningKey: currentKey,
        nextSigningKey: nextKey,
      });
      const bodyText = await req.clone().text();
      const isValid = await receiver.verify({
        signature,
        body: bodyText,
        url: req.url,
      });
      if (isValid) return true;
    } catch (err) {
      console.warn("⚠️ QStash signature verification failed:", err);
    }
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader === `Bearer ${WORKER_SECRET}`) {
    return true;
  }

  return false;
}
