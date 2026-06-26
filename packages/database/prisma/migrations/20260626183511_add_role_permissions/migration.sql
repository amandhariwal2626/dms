-- CreateEnum
CREATE TYPE "permission_effect" AS ENUM ('ALLOW', 'DENY');

-- CreateEnum
CREATE TYPE "permission_scope" AS ENUM ('GLOBAL', 'COMPANY', 'WAREHOUSE', 'REGION', 'ROUTE', 'BEAT', 'SELF', 'CUSTOM');

-- CreateEnum
CREATE TYPE "role_permission_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "effect" "permission_effect" NOT NULL DEFAULT 'ALLOW',
    "scope" "permission_scope" NOT NULL DEFAULT 'GLOBAL',
    "condition_expression" TEXT,
    "field_restrictions" JSONB,
    "row_filter" JSONB,
    "effective_from" TIMESTAMP(3),
    "effective_to" TIMESTAMP(3),
    "is_inherited" BOOLEAN NOT NULL DEFAULT false,
    "is_system_assigned" BOOLEAN NOT NULL DEFAULT false,
    "status" "role_permission_status" NOT NULL DEFAULT 'ACTIVE',
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

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "role_permissions_module_id_idx" ON "role_permissions"("module_id");

-- CreateIndex
CREATE INDEX "role_permissions_effect_idx" ON "role_permissions"("effect");

-- CreateIndex
CREATE INDEX "role_permissions_scope_idx" ON "role_permissions"("scope");

-- CreateIndex
CREATE INDEX "role_permissions_status_idx" ON "role_permissions"("status");

-- CreateIndex
CREATE INDEX "role_permissions_is_deleted_idx" ON "role_permissions"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
