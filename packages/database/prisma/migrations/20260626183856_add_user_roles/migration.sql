-- CreateEnum
CREATE TYPE "user_role_source" AS ENUM ('SYSTEM', 'SELF_ONBOARDING', 'INVITATION', 'MANUAL', 'IMPORT', 'API');

-- CreateEnum
CREATE TYPE "user_role_scope" AS ENUM ('GLOBAL', 'COMPANY', 'WAREHOUSE', 'REGION', 'ROUTE', 'BEAT', 'SELF', 'CUSTOM');

-- CreateEnum
CREATE TYPE "user_role_status" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED');

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "company_user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "assigned_by" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignment_reason" TEXT,
    "source" "user_role_source" NOT NULL DEFAULT 'MANUAL',
    "effective_from" TIMESTAMP(3),
    "effective_to" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_primary_role" BOOLEAN NOT NULL DEFAULT false,
    "scope" "user_role_scope" NOT NULL DEFAULT 'COMPANY',
    "scope_reference_id" TEXT,
    "status" "user_role_status" NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_roles_company_user_id_idx" ON "user_roles"("company_user_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE INDEX "user_roles_status_idx" ON "user_roles"("status");

-- CreateIndex
CREATE INDEX "user_roles_is_primary_role_idx" ON "user_roles"("is_primary_role");

-- CreateIndex
CREATE INDEX "user_roles_effective_from_idx" ON "user_roles"("effective_from");

-- CreateIndex
CREATE INDEX "user_roles_effective_to_idx" ON "user_roles"("effective_to");

-- CreateIndex
CREATE INDEX "user_roles_is_deleted_idx" ON "user_roles"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_company_user_id_role_id_key" ON "user_roles"("company_user_id", "role_id");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_company_user_id_fkey" FOREIGN KEY ("company_user_id") REFERENCES "company_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
