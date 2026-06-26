-- CreateEnum
CREATE TYPE "employment_type" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'FREELANCE', 'CONSULTANT', 'PROBATION', 'TRAINEE');

-- CreateEnum
CREATE TYPE "employment_status" AS ENUM ('ACTIVE', 'PROBATION', 'NOTICE_PERIOD', 'TERMINATED', 'RESIGNED', 'RETIRED', 'DEPUTATION');

-- CreateEnum
CREATE TYPE "company_user_status" AS ENUM ('INVITED', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED', 'LEFT');

-- CreateEnum
CREATE TYPE "department" AS ENUM ('ADMIN', 'HR', 'FINANCE', 'IT', 'SALES', 'MARKETING', 'OPERATIONS', 'PURCHASE', 'WAREHOUSE', 'LOGISTICS', 'PRODUCTION', 'QUALITY', 'RND', 'CUSTOMER_SUPPORT', 'LEGAL', 'OTHER');

-- CreateEnum
CREATE TYPE "business_unit" AS ENUM ('FMCG', 'PHARMA', 'ELECTRONICS', 'AUTOMOTIVE', 'AGRICULTURE', 'TEXTILE', 'CHEMICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "division" AS ENUM ('DOMESTIC', 'EXPORT', 'WHOLESALE', 'RETAIL', 'ONLINE', 'INSTITUTIONAL', 'OTHER');

-- CreateTable
CREATE TABLE "company_users" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "employee_code" TEXT NOT NULL,
    "official_email" TEXT NOT NULL,
    "official_mobile_number" TEXT,
    "designation" TEXT,
    "department" "department",
    "job_title" TEXT,
    "employment_type" "employment_type",
    "employment_status" "employment_status",
    "joining_date" TIMESTAMP(3),
    "confirmation_date" TIMESTAMP(3),
    "relieving_date" TIMESTAMP(3),
    "experience_in_years" INTEGER,
    "reporting_manager_id" TEXT,
    "is_reporting_manager" BOOLEAN NOT NULL DEFAULT false,
    "is_primary_company" BOOLEAN NOT NULL DEFAULT false,
    "is_default_company" BOOLEAN NOT NULL DEFAULT false,
    "can_switch_company" BOOLEAN NOT NULL DEFAULT true,
    "default_warehouse_id" TEXT,
    "default_route_id" TEXT,
    "default_beat_id" TEXT,
    "default_sales_region_id" TEXT,
    "default_price_list_id" TEXT,
    "work_location" TEXT,
    "cost_center" TEXT,
    "business_unit" "business_unit",
    "division" "division",
    "sales_region" TEXT,
    "zone" TEXT,
    "territory" TEXT,
    "cluster" TEXT,
    "can_approve_orders" BOOLEAN NOT NULL DEFAULT false,
    "can_approve_returns" BOOLEAN NOT NULL DEFAULT false,
    "can_approve_purchases" BOOLEAN NOT NULL DEFAULT false,
    "can_approve_payments" BOOLEAN NOT NULL DEFAULT false,
    "approval_limit" DECIMAL(65,30),
    "last_company_login_at" TIMESTAMP(3),
    "last_company_login_ip" TEXT,
    "last_company_login_device" TEXT,
    "invited_by" TEXT,
    "invited_at" TIMESTAMP(3),
    "accepted_invitation_at" TIMESTAMP(3),
    "status" "company_user_status" NOT NULL DEFAULT 'INVITED',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "company_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_users_company_id_idx" ON "company_users"("company_id");

-- CreateIndex
CREATE INDEX "company_users_user_id_idx" ON "company_users"("user_id");

-- CreateIndex
CREATE INDEX "company_users_employee_code_idx" ON "company_users"("employee_code");

-- CreateIndex
CREATE INDEX "company_users_official_email_idx" ON "company_users"("official_email");

-- CreateIndex
CREATE INDEX "company_users_designation_idx" ON "company_users"("designation");

-- CreateIndex
CREATE INDEX "company_users_department_idx" ON "company_users"("department");

-- CreateIndex
CREATE INDEX "company_users_status_idx" ON "company_users"("status");

-- CreateIndex
CREATE INDEX "company_users_reporting_manager_id_idx" ON "company_users"("reporting_manager_id");

-- CreateIndex
CREATE INDEX "company_users_is_deleted_idx" ON "company_users"("is_deleted");

-- CreateIndex
CREATE INDEX "company_users_joining_date_idx" ON "company_users"("joining_date");

-- CreateIndex
CREATE UNIQUE INDEX "company_users_company_id_user_id_key" ON "company_users"("company_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_users_company_id_employee_code_key" ON "company_users"("company_id", "employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "company_users_company_id_official_email_key" ON "company_users"("company_id", "official_email");

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_reporting_manager_id_fkey" FOREIGN KEY ("reporting_manager_id") REFERENCES "company_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
