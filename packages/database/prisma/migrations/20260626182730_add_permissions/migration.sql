-- CreateEnum
CREATE TYPE "permission_action" AS ENUM ('VIEW', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'IMPORT', 'EXPORT', 'PRINT', 'UPLOAD', 'DOWNLOAD', 'ASSIGN', 'TRANSFER', 'CANCEL', 'RESTORE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "permission_type" AS ENUM ('MENU', 'SCREEN', 'API', 'ACTION', 'FEATURE');

-- CreateEnum
CREATE TYPE "permission_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "http_method" AS ENUM ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS');

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "sub_module" TEXT,
    "feature" TEXT,
    "screen" TEXT,
    "name" TEXT NOT NULL,
    "display_name" TEXT,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "action" "permission_action" NOT NULL,
    "resource_type" TEXT,
    "resource_name" TEXT,
    "api_endpoint" TEXT,
    "http_method" "http_method",
    "frontend_route" TEXT,
    "menu_key" TEXT,
    "icon" TEXT,
    "display_order" INTEGER,
    "show_in_menu" BOOLEAN NOT NULL DEFAULT true,
    "show_in_sidebar" BOOLEAN NOT NULL DEFAULT true,
    "show_in_mobile" BOOLEAN NOT NULL DEFAULT true,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "permission_type" "permission_type" NOT NULL DEFAULT 'FEATURE',
    "is_system_permission" BOOLEAN NOT NULL DEFAULT false,
    "is_editable" BOOLEAN NOT NULL DEFAULT true,
    "is_deprecated" BOOLEAN NOT NULL DEFAULT false,
    "status" "permission_status" NOT NULL DEFAULT 'ACTIVE',
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

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_module_idx" ON "permissions"("module");

-- CreateIndex
CREATE INDEX "permissions_sub_module_idx" ON "permissions"("sub_module");

-- CreateIndex
CREATE INDEX "permissions_feature_idx" ON "permissions"("feature");

-- CreateIndex
CREATE INDEX "permissions_action_idx" ON "permissions"("action");

-- CreateIndex
CREATE INDEX "permissions_permission_type_idx" ON "permissions"("permission_type");

-- CreateIndex
CREATE INDEX "permissions_status_idx" ON "permissions"("status");

-- CreateIndex
CREATE INDEX "permissions_code_idx" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_is_deleted_idx" ON "permissions"("is_deleted");
