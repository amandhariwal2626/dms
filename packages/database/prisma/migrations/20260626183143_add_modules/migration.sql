-- CreateEnum
CREATE TYPE "module_status" AS ENUM ('ACTIVE', 'INACTIVE', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "module_category" AS ENUM ('CORE', 'MASTER', 'TRANSACTION', 'REPORTS', 'CONFIGURATION', 'INTEGRATION', 'SETTINGS');

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "display_name" TEXT,
    "description" TEXT,
    "parent_module_id" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "route" TEXT,
    "icon" TEXT,
    "menu_key" TEXT,
    "badge" TEXT,
    "show_in_sidebar" BOOLEAN NOT NULL DEFAULT true,
    "show_in_navbar" BOOLEAN NOT NULL DEFAULT true,
    "show_in_mobile" BOOLEAN NOT NULL DEFAULT true,
    "show_in_settings" BOOLEAN NOT NULL DEFAULT true,
    "is_core_module" BOOLEAN NOT NULL DEFAULT false,
    "is_system_module" BOOLEAN NOT NULL DEFAULT false,
    "is_licensable" BOOLEAN NOT NULL DEFAULT false,
    "is_enabled_by_default" BOOLEAN NOT NULL DEFAULT true,
    "requires_subscription" BOOLEAN NOT NULL DEFAULT false,
    "subscription_feature_key" TEXT,
    "color" TEXT,
    "category" "module_category",
    "group_name" TEXT,
    "status" "module_status" NOT NULL DEFAULT 'ACTIVE',
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

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "modules_name_key" ON "modules"("name");

-- CreateIndex
CREATE UNIQUE INDEX "modules_code_key" ON "modules"("code");

-- CreateIndex
CREATE INDEX "modules_name_idx" ON "modules"("name");

-- CreateIndex
CREATE INDEX "modules_code_idx" ON "modules"("code");

-- CreateIndex
CREATE INDEX "modules_display_order_idx" ON "modules"("display_order");

-- CreateIndex
CREATE INDEX "modules_parent_module_id_idx" ON "modules"("parent_module_id");

-- CreateIndex
CREATE INDEX "modules_status_idx" ON "modules"("status");

-- CreateIndex
CREATE INDEX "modules_is_deleted_idx" ON "modules"("is_deleted");

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_parent_module_id_fkey" FOREIGN KEY ("parent_module_id") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
