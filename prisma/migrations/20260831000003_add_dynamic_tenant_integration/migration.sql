-- AlterTable
ALTER TABLE "doctor_settings" ADD COLUMN IF NOT EXISTS "n8nEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "doctor_settings" ADD COLUMN IF NOT EXISTS "n8nWebhookUrl" TEXT;
ALTER TABLE "doctor_settings" ADD COLUMN IF NOT EXISTS "integrationStatus" TEXT NOT NULL DEFAULT 'READY';
ALTER TABLE "doctor_settings" ADD COLUMN IF NOT EXISTS "lastHealthCheckAt" TIMESTAMP(3);
ALTER TABLE "doctor_settings" ADD COLUMN IF NOT EXISTS "lastIntegrationError" TEXT;
ALTER TABLE "doctor_settings" ADD COLUMN IF NOT EXISTS "customSystemPrompt" TEXT;
