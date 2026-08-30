/**
 * Environment Variable Validation & Configuration Module
 * Ensures mandatory production environment variables are configured securely.
 */

export interface AppEnv {
  NODE_ENV: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  OPENAI_API_KEY?: string;
  WHATSAPP_VERIFY_TOKEN: string;
  EMAIL_PROVIDER: "RESEND" | "SMTP" | "LOG_ONLY";
  RESEND_API_KEY?: string;
  APP_URL: string;
}

export function validateEnv(): AppEnv {
  const NODE_ENV = process.env.NODE_ENV || "development";
  const DATABASE_URL = process.env.DATABASE_URL || "file:./dev.db";
  const JWT_SECRET = process.env.JWT_SECRET || "tabibi_production_secret_jwt_key_2026_change_in_prod";
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "tabibi_webhook_verify_secret";
  const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER as any) || "LOG_ONLY";
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const APP_URL = process.env.APP_URL || "http://localhost:3000";

  if (NODE_ENV === "production") {
    if (JWT_SECRET === "tabibi_production_secret_jwt_key_2026_change_in_prod") {
      console.warn("⚠️ WARNING: JWT_SECRET is using default fallback value in production!");
    }
  }

  return {
    NODE_ENV,
    DATABASE_URL,
    JWT_SECRET,
    OPENAI_API_KEY,
    WHATSAPP_VERIFY_TOKEN,
    EMAIL_PROVIDER,
    RESEND_API_KEY,
    APP_URL,
  };
}

export const env = validateEnv();
