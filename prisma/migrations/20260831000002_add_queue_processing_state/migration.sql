-- AlterTable
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "processingState" TEXT NOT NULL DEFAULT 'PROCESSED';
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "lastError" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "queuedAt" TIMESTAMP(3);
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "messages_processingState_idx" ON "messages"("processingState");
