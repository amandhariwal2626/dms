-- CreateEnum
CREATE TYPE "verification_purpose" AS ENUM ('REGISTER', 'LOGIN', 'CHANGE_EMAIL', 'RESET_PASSWORD', 'INVITE');

-- CreateEnum
CREATE TYPE "verification_token_type" AS ENUM ('OTP', 'MAGIC_LINK', 'EMAIL_LINK');

-- CreateEnum
CREATE TYPE "verification_status" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'FAILED', 'BLOCKED');

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT,
    "otp" TEXT,
    "purpose" "verification_purpose" NOT NULL,
    "token_type" "verification_token_type" NOT NULL,
    "expires_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "resend_count" INTEGER NOT NULL DEFAULT 0,
    "last_resend_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_id" TEXT,
    "browser" TEXT,
    "platform" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "failure_reason" TEXT,
    "status" "verification_status" NOT NULL DEFAULT 'PENDING',
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_verification_tokens_email_idx" ON "email_verification_tokens"("email");

-- CreateIndex
CREATE INDEX "email_verification_tokens_otp_idx" ON "email_verification_tokens"("otp");

-- CreateIndex
CREATE INDEX "email_verification_tokens_token_idx" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_purpose_idx" ON "email_verification_tokens"("purpose");

-- CreateIndex
CREATE INDEX "email_verification_tokens_status_idx" ON "email_verification_tokens"("status");

-- CreateIndex
CREATE INDEX "email_verification_tokens_expires_at_idx" ON "email_verification_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "email_verification_tokens_created_at_idx" ON "email_verification_tokens"("created_at");

-- CreateIndex
CREATE INDEX "email_verification_tokens_is_deleted_idx" ON "email_verification_tokens"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_email_purpose_is_used_is_deleted_key" ON "email_verification_tokens"("email", "purpose", "is_used", "is_deleted");
