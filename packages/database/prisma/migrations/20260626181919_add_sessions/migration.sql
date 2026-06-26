-- CreateEnum
CREATE TYPE "device_type" AS ENUM ('MOBILE', 'TABLET', 'DESKTOP', 'LAPTOP', 'SMART_TV', 'KIOSK', 'OTHER');

-- CreateEnum
CREATE TYPE "platform" AS ENUM ('WEB', 'ANDROID', 'IOS', 'WINDOWS', 'MACOS', 'LINUX', 'API');

-- CreateEnum
CREATE TYPE "session_status" AS ENUM ('ACTIVE', 'EXPIRED', 'LOGGED_OUT', 'REVOKED', 'IDLE_TIMEOUT');

-- CreateEnum
CREATE TYPE "logout_reason" AS ENUM ('USER_LOGOUT', 'SESSION_EXPIRED', 'DEVICE_REVOKED', 'ADMIN_REVOKED', 'PASSWORD_CHANGED', 'IDLE_TIMEOUT', 'MAX_SESSIONS_REACHED', 'SUSPICIOUS_ACTIVITY', 'OTHER');

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "refresh_token_version" INTEGER NOT NULL DEFAULT 0,
    "jwt_id" TEXT NOT NULL,
    "device_id" TEXT,
    "device_name" TEXT,
    "device_type" "device_type",
    "operating_system" TEXT,
    "os_version" TEXT,
    "browser" TEXT,
    "browser_version" TEXT,
    "app_version" TEXT,
    "platform" "platform",
    "ip_address" TEXT,
    "user_agent" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "timezone" TEXT,
    "login_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "logged_out_at" TIMESTAMP(3),
    "logout_reason" "logout_reason",
    "is_current_session" BOOLEAN NOT NULL DEFAULT false,
    "is_trusted_device" BOOLEAN NOT NULL DEFAULT false,
    "remember_me" BOOLEAN NOT NULL DEFAULT false,
    "mfa_verified" BOOLEAN NOT NULL DEFAULT false,
    "risk_score" INTEGER,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMP(3),
    "revoked_by" TEXT,
    "revocation_reason" TEXT,
    "status" "session_status" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_access_token_id_key" ON "sessions"("access_token_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_jwt_id_key" ON "sessions"("jwt_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_device_id_idx" ON "sessions"("device_id");

-- CreateIndex
CREATE INDEX "sessions_status_idx" ON "sessions"("status");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "sessions_login_at_idx" ON "sessions"("login_at");

-- CreateIndex
CREATE INDEX "sessions_last_activity_at_idx" ON "sessions"("last_activity_at");

-- CreateIndex
CREATE INDEX "sessions_is_revoked_idx" ON "sessions"("is_revoked");

-- CreateIndex
CREATE INDEX "sessions_is_deleted_idx" ON "sessions"("is_deleted");

-- CreateIndex
CREATE INDEX "sessions_ip_address_idx" ON "sessions"("ip_address");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
