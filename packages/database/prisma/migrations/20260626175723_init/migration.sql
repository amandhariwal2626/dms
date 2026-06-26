-- CreateEnum
CREATE TYPE "business_type" AS ENUM ('SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LIMITED_LIABILITY_PARTNERSHIP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'ONE_PERSON_COMPANY', 'NON_PROFIT', 'GOVERNMENT_UNDERTAKING', 'OTHER');

-- CreateEnum
CREATE TYPE "company_category" AS ENUM ('MANUFACTURER', 'DISTRIBUTOR', 'WHOLESALER', 'RETAILER', 'SUPPLIER', 'SERVICE_PROVIDER', 'BROKER', 'AGENT', 'OTHER');

-- CreateEnum
CREATE TYPE "subscription_plan" AS ENUM ('FREE', 'STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'TRIAL', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "company_status" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DISABLED', 'ARCHIVED', 'PENDING_VERIFICATION', 'REJECTED');

-- CreateEnum
CREATE TYPE "currency" AS ENUM ('INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD');

-- CreateEnum
CREATE TYPE "timezone" AS ENUM ('UTC', 'ASIA_KOLKATA', 'ASIA_DUBAI', 'ASIA_SINGAPORE', 'AMERICA_NEW_YORK', 'AMERICA_CHICAGO', 'AMERICA_DENVER', 'AMERICA_LOS_ANGELES', 'EUROPE_LONDON', 'EUROPE_BERLIN', 'EUROPE_PARIS', 'AUSTRALIA_SYDNEY');

-- CreateEnum
CREATE TYPE "language" AS ENUM ('EN', 'HI', 'GU', 'MR', 'TA', 'TE', 'KN', 'BN', 'ES', 'FR', 'AR');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "company_code" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "business_type" "business_type" NOT NULL,
    "company_category" "company_category" NOT NULL,
    "gst_number" TEXT,
    "pan_number" TEXT,
    "tan_number" TEXT,
    "cin_number" TEXT,
    "udyam_registration_number" TEXT,
    "fssai_number" TEXT,
    "drug_license_number" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "alternate_phone" TEXT,
    "logo_url" TEXT,
    "description" TEXT,
    "currency" "currency" NOT NULL DEFAULT 'INR',
    "timezone" "timezone" NOT NULL DEFAULT 'ASIA_KOLKATA',
    "date_format" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "time_format" TEXT NOT NULL DEFAULT 'HH:mm',
    "country_code" TEXT NOT NULL DEFAULT '+91',
    "language" "language" NOT NULL DEFAULT 'EN',
    "financial_year_start_month" INTEGER NOT NULL DEFAULT 4,
    "default_tax_type" TEXT,
    "base_currency" "currency" NOT NULL DEFAULT 'INR',
    "decimal_precision" INTEGER NOT NULL DEFAULT 2,
    "quantity_precision" INTEGER NOT NULL DEFAULT 2,
    "price_precision" INTEGER NOT NULL DEFAULT 2,
    "weight_precision" INTEGER NOT NULL DEFAULT 2,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "landmark" TEXT,
    "city" TEXT,
    "district" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postal_code" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "subscription_plan" "subscription_plan" NOT NULL DEFAULT 'FREE',
    "subscription_status" "subscription_status" NOT NULL DEFAULT 'TRIAL',
    "subscription_start_date" TIMESTAMP(3),
    "subscription_end_date" TIMESTAMP(3),
    "trial_ends_at" TIMESTAMP(3),
    "max_users" INTEGER NOT NULL DEFAULT 5,
    "max_warehouses" INTEGER NOT NULL DEFAULT 1,
    "max_products" INTEGER NOT NULL DEFAULT 100,
    "max_retailers" INTEGER NOT NULL DEFAULT 50,
    "max_distributors" INTEGER NOT NULL DEFAULT 10,
    "max_salesmen" INTEGER NOT NULL DEFAULT 10,
    "max_orders_per_month" INTEGER NOT NULL DEFAULT 500,
    "storage_limit_in_gb" INTEGER NOT NULL DEFAULT 5,
    "allow_negative_inventory" BOOLEAN NOT NULL DEFAULT false,
    "enable_batch_tracking" BOOLEAN NOT NULL DEFAULT false,
    "enable_expiry_tracking" BOOLEAN NOT NULL DEFAULT false,
    "enable_serial_number_tracking" BOOLEAN NOT NULL DEFAULT false,
    "enable_multi_warehouse" BOOLEAN NOT NULL DEFAULT false,
    "enable_multi_currency" BOOLEAN NOT NULL DEFAULT false,
    "enable_route_management" BOOLEAN NOT NULL DEFAULT false,
    "enable_beat_planning" BOOLEAN NOT NULL DEFAULT false,
    "enable_attendance" BOOLEAN NOT NULL DEFAULT false,
    "enable_geo_tracking" BOOLEAN NOT NULL DEFAULT false,
    "enable_secondary_sales" BOOLEAN NOT NULL DEFAULT false,
    "enable_primary_sales" BOOLEAN NOT NULL DEFAULT false,
    "enable_promotions" BOOLEAN NOT NULL DEFAULT false,
    "enable_loyalty_program" BOOLEAN NOT NULL DEFAULT false,
    "enable_price_list" BOOLEAN NOT NULL DEFAULT false,
    "enable_scheme_management" BOOLEAN NOT NULL DEFAULT false,
    "enable_purchase_module" BOOLEAN NOT NULL DEFAULT false,
    "enable_returns" BOOLEAN NOT NULL DEFAULT false,
    "enable_approvals" BOOLEAN NOT NULL DEFAULT false,
    "enable_audit_logs" BOOLEAN NOT NULL DEFAULT false,
    "enable_api_access" BOOLEAN NOT NULL DEFAULT false,
    "enable_webhook" BOOLEAN NOT NULL DEFAULT false,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "favicon_url" TEXT,
    "email_header_logo" TEXT,
    "invoice_logo" TEXT,
    "status" "company_status" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_date" TIMESTAMP(3),
    "verified_by" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_company_code_key" ON "companies"("company_code");

-- CreateIndex
CREATE UNIQUE INDEX "companies_gst_number_key" ON "companies"("gst_number");

-- CreateIndex
CREATE UNIQUE INDEX "companies_pan_number_key" ON "companies"("pan_number");

-- CreateIndex
CREATE UNIQUE INDEX "companies_email_key" ON "companies"("email");

-- CreateIndex
CREATE INDEX "companies_company_code_idx" ON "companies"("company_code");

-- CreateIndex
CREATE INDEX "companies_status_idx" ON "companies"("status");

-- CreateIndex
CREATE INDEX "companies_gst_number_idx" ON "companies"("gst_number");

-- CreateIndex
CREATE INDEX "companies_legal_name_idx" ON "companies"("legal_name");

-- CreateIndex
CREATE INDEX "companies_display_name_idx" ON "companies"("display_name");

-- CreateIndex
CREATE INDEX "companies_is_deleted_idx" ON "companies"("is_deleted");

-- CreateIndex
CREATE INDEX "companies_subscription_status_idx" ON "companies"("subscription_status");

-- CreateIndex
CREATE INDEX "companies_business_type_idx" ON "companies"("business_type");

-- CreateIndex
CREATE INDEX "companies_company_category_idx" ON "companies"("company_category");

-- CreateIndex
CREATE INDEX "companies_city_idx" ON "companies"("city");

-- CreateIndex
CREATE INDEX "companies_state_idx" ON "companies"("state");

-- CreateIndex
CREATE INDEX "companies_created_at_idx" ON "companies"("created_at");
