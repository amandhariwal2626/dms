-- CreateEnum
CREATE TYPE "gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "marital_status" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "preferred_communication_channel" AS ENUM ('EMAIL', 'SMS', 'WHATSAPP', 'PUSH_NOTIFICATION', 'IN_APP');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'PENDING_VERIFICATION', 'LOCKED', 'SUSPENDED', 'INACTIVE', 'DELETED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "normalized_email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "normalized_username" TEXT NOT NULL,
    "mobile_number" TEXT,
    "alternate_mobile_number" TEXT,
    "first_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "last_name" TEXT,
    "display_name" TEXT,
    "profile_photo_url" TEXT,
    "gender" "gender",
    "date_of_birth" TIMESTAMP(3),
    "blood_group" TEXT,
    "marital_status" "marital_status",
    "nationality" TEXT,
    "preferred_language" "language" NOT NULL DEFAULT 'EN',
    "timezone" "timezone" NOT NULL DEFAULT 'ASIA_KOLKATA',
    "password_hash" TEXT NOT NULL,
    "password_changed_at" TIMESTAMP(3),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMP(3),
    "mobile_verified" BOOLEAN NOT NULL DEFAULT false,
    "mobile_verified_at" TIMESTAMP(3),
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT,
    "password_reset_required" BOOLEAN NOT NULL DEFAULT false,
    "force_password_change" BOOLEAN NOT NULL DEFAULT false,
    "refresh_token_version" INTEGER NOT NULL DEFAULT 0,
    "security_stamp" TEXT,
    "last_login_at" TIMESTAMP(3),
    "last_login_ip" TEXT,
    "last_login_user_agent" TEXT,
    "last_login_device" TEXT,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "lock_until" TIMESTAMP(3),
    "last_password_reset_at" TIMESTAMP(3),
    "status" "user_status" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "preferred_communication_channel" "preferred_communication_channel" NOT NULL DEFAULT 'EMAIL',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_normalized_email_key" ON "users"("normalized_email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_normalized_username_key" ON "users"("normalized_username");

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_number_key" ON "users"("mobile_number");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_normalized_email_idx" ON "users"("normalized_email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_normalized_username_idx" ON "users"("normalized_username");

-- CreateIndex
CREATE INDEX "users_mobile_number_idx" ON "users"("mobile_number");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_is_deleted_idx" ON "users"("is_deleted");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "users_last_login_at_idx" ON "users"("last_login_at");
