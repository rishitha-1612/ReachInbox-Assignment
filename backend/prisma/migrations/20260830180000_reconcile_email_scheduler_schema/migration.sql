-- Bring the initial schema in line with the current email scheduler data model.

-- DropIndex
DROP INDEX "EmailJob_senderId_idx";

-- DropIndex
DROP INDEX "EmailJob_status_idx";

-- AlterTable
ALTER TABLE "EmailJob" DROP COLUMN "delayBetweenEmails",
ADD COLUMN     "batchId" TEXT NOT NULL,
ADD COLUMN     "delayBetweenEmailsMs" INTEGER NOT NULL,
ADD COLUMN     "maxAttempts" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "Sender" DROP COLUMN "smtpPass",
ADD COLUMN     "smtpPassEncrypted" TEXT NOT NULL;

-- DropTable
DROP TABLE "RateLimitWindow";

-- CreateIndex
CREATE INDEX "EmailJob_userId_status_idx" ON "EmailJob"("userId", "status");

-- CreateIndex
CREATE INDEX "EmailJob_senderId_status_idx" ON "EmailJob"("senderId", "status");

-- CreateIndex
CREATE INDEX "EmailJob_batchId_idx" ON "EmailJob"("batchId");

-- CreateIndex
CREATE INDEX "EmailJob_status_scheduledFor_idx" ON "EmailJob"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "Sender_userId_isDefault_idx" ON "Sender"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
