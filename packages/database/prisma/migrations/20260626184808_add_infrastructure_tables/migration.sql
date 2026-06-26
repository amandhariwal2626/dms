-- CreateEnum
CREATE TYPE "audit_operation" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'IMPORT', 'EXPORT', 'PRINT', 'DOWNLOAD', 'UPLOAD', 'ASSIGN', 'REVOKE', 'APPROVE', 'REJECT', 'CANCEL', 'RESTORE', 'ARCHIVE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "audit_severity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL', 'SECURITY');

-- CreateEnum
CREATE TYPE "activity_type" AS ENUM ('LOGIN', 'LOGOUT', 'PROFILE_UPDATE', 'PASSWORD_CHANGE', 'SETTINGS_CHANGE', 'ROLE_CHANGE', 'PERMISSION_CHANGE', 'DATA_CREATE', 'DATA_UPDATE', 'DATA_DELETE', 'DATA_IMPORT', 'DATA_EXPORT', 'REPORT_GENERATED', 'APPROVAL', 'REJECTION', 'NOTE_ADDED', 'STATUS_CHANGE', 'ASSIGNMENT', 'TRANSFER', 'OTHER');

-- CreateEnum
CREATE TYPE "activity_status" AS ENUM ('SUCCESS', 'FAILED', 'PENDING', 'SKIPPED');

-- CreateEnum
CREATE TYPE "file_category" AS ENUM ('COMPANY_LOGO', 'USER_PROFILE', 'PRODUCT_IMAGE', 'KYC_DOCUMENT', 'PURCHASE_INVOICE', 'SALES_INVOICE', 'RETURN_DOCUMENT', 'PAYMENT_RECEIPT', 'AGREEMENT', 'ATTACHMENT', 'REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "storage_provider" AS ENUM ('AWS_S3', 'AZURE_BLOB', 'MINIO', 'LOCAL', 'GCP_STORAGE');

-- CreateEnum
CREATE TYPE "virus_scan_status" AS ENUM ('NOT_SCANNED', 'CLEAN', 'INFECTED', 'SCANNING_FAILED', 'QUARANTINED');

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "default_language" "language" NOT NULL DEFAULT 'EN',
    "default_timezone" "timezone" NOT NULL DEFAULT 'ASIA_KOLKATA',
    "default_currency" "currency" NOT NULL DEFAULT 'INR',
    "date_format" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "time_format" TEXT NOT NULL DEFAULT 'HH:mm',
    "week_starts_on" INTEGER NOT NULL DEFAULT 1,
    "financial_year_start_month" INTEGER NOT NULL DEFAULT 4,
    "decimal_precision" INTEGER NOT NULL DEFAULT 2,
    "quantity_precision" INTEGER NOT NULL DEFAULT 2,
    "price_precision" INTEGER NOT NULL DEFAULT 2,
    "weight_precision" INTEGER NOT NULL DEFAULT 2,
    "default_warehouse_id" TEXT,
    "default_price_list_id" TEXT,
    "default_tax_id" TEXT,
    "default_sales_order_prefix" TEXT,
    "default_invoice_prefix" TEXT,
    "default_purchase_prefix" TEXT,
    "default_return_prefix" TEXT,
    "default_payment_prefix" TEXT,
    "auto_generate_product_code" BOOLEAN NOT NULL DEFAULT true,
    "auto_generate_customer_code" BOOLEAN NOT NULL DEFAULT true,
    "auto_generate_distributor_code" BOOLEAN NOT NULL DEFAULT true,
    "auto_generate_sales_order_number" BOOLEAN NOT NULL DEFAULT true,
    "auto_generate_invoice_number" BOOLEAN NOT NULL DEFAULT true,
    "number_series" JSONB,
    "allow_negative_inventory" BOOLEAN NOT NULL DEFAULT false,
    "enable_batch_tracking" BOOLEAN NOT NULL DEFAULT false,
    "enable_expiry_tracking" BOOLEAN NOT NULL DEFAULT false,
    "enable_serial_number_tracking" BOOLEAN NOT NULL DEFAULT false,
    "enable_multi_warehouse" BOOLEAN NOT NULL DEFAULT false,
    "stock_reservation_enabled" BOOLEAN NOT NULL DEFAULT false,
    "default_stock_valuation_method" TEXT,
    "default_tax_type" TEXT,
    "gst_enabled" BOOLEAN NOT NULL DEFAULT true,
    "tds_enabled" BOOLEAN NOT NULL DEFAULT false,
    "tcs_enabled" BOOLEAN NOT NULL DEFAULT false,
    "round_off_method" TEXT,
    "approval_workflow_enabled" BOOLEAN NOT NULL DEFAULT false,
    "sales_approval_required" BOOLEAN NOT NULL DEFAULT false,
    "purchase_approval_required" BOOLEAN NOT NULL DEFAULT false,
    "payment_approval_required" BOOLEAN NOT NULL DEFAULT false,
    "return_approval_required" BOOLEAN NOT NULL DEFAULT false,
    "password_policy" JSONB,
    "session_timeout" INTEGER NOT NULL DEFAULT 30,
    "max_concurrent_sessions" INTEGER NOT NULL DEFAULT 5,
    "enable_two_factor" BOOLEAN NOT NULL DEFAULT false,
    "ip_whitelisting_enabled" BOOLEAN NOT NULL DEFAULT false,
    "allowed_ip_addresses" JSONB,
    "feature_flags" JSONB,
    "notification_settings" JSONB,
    "email_settings" JSONB,
    "sms_settings" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT,
    "user_id" TEXT,
    "company_user_id" TEXT,
    "entity_name" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "operation" "audit_operation" NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "changed_fields" JSONB,
    "reason" TEXT,
    "request_id" TEXT,
    "trace_id" TEXT,
    "session_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "platform" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "failure_reason" TEXT,
    "severity" "audit_severity" NOT NULL DEFAULT 'INFO',
    "retention_until" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "company_id" TEXT,
    "user_id" TEXT,
    "company_user_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "activity_type" "activity_type" NOT NULL,
    "module" TEXT,
    "entity_name" TEXT,
    "entity_id" TEXT,
    "reference_number" TEXT,
    "reference_type" TEXT,
    "status" "activity_status" NOT NULL DEFAULT 'SUCCESS',
    "icon" TEXT,
    "color" TEXT,
    "route" TEXT,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_attachments" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "original_file_name" TEXT NOT NULL,
    "stored_file_name" TEXT NOT NULL,
    "file_extension" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_category" "file_category" NOT NULL,
    "file_size" BIGINT NOT NULL,
    "storage_provider" "storage_provider" NOT NULL,
    "bucket_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "public_url" TEXT,
    "thumbnail_url" TEXT,
    "checksum" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "folder" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
    "encryption_algorithm" TEXT,
    "virus_scan_status" "virus_scan_status" NOT NULL DEFAULT 'NOT_SCANNED',
    "virus_scanned_at" TIMESTAMP(3),
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "last_downloaded_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "file_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_settings_company_id_key" ON "company_settings"("company_id");

-- CreateIndex
CREATE INDEX "company_settings_company_id_idx" ON "company_settings"("company_id");

-- CreateIndex
CREATE INDEX "company_settings_is_deleted_idx" ON "company_settings"("is_deleted");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_idx" ON "audit_logs"("company_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_name_idx" ON "audit_logs"("entity_name");

-- CreateIndex
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs"("entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_operation_idx" ON "audit_logs"("operation");

-- CreateIndex
CREATE INDEX "audit_logs_performed_at_idx" ON "audit_logs"("performed_at");

-- CreateIndex
CREATE INDEX "audit_logs_request_id_idx" ON "audit_logs"("request_id");

-- CreateIndex
CREATE INDEX "audit_logs_trace_id_idx" ON "audit_logs"("trace_id");

-- CreateIndex
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs"("severity");

-- CreateIndex
CREATE INDEX "activity_logs_company_id_idx" ON "activity_logs"("company_id");

-- CreateIndex
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "activity_logs_activity_type_idx" ON "activity_logs"("activity_type");

-- CreateIndex
CREATE INDEX "activity_logs_module_idx" ON "activity_logs"("module");

-- CreateIndex
CREATE INDEX "activity_logs_performed_at_idx" ON "activity_logs"("performed_at");

-- CreateIndex
CREATE INDEX "file_attachments_company_id_idx" ON "file_attachments"("company_id");

-- CreateIndex
CREATE INDEX "file_attachments_entity_type_idx" ON "file_attachments"("entity_type");

-- CreateIndex
CREATE INDEX "file_attachments_entity_id_idx" ON "file_attachments"("entity_id");

-- CreateIndex
CREATE INDEX "file_attachments_file_category_idx" ON "file_attachments"("file_category");

-- CreateIndex
CREATE INDEX "file_attachments_mime_type_idx" ON "file_attachments"("mime_type");

-- CreateIndex
CREATE INDEX "file_attachments_storage_provider_idx" ON "file_attachments"("storage_provider");

-- CreateIndex
CREATE INDEX "file_attachments_uploaded_by_idx" ON "file_attachments"("uploaded_by");

-- CreateIndex
CREATE INDEX "file_attachments_created_at_idx" ON "file_attachments"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "file_attachments_company_id_checksum_key" ON "file_attachments"("company_id", "checksum");

-- AddForeignKey
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_user_id_fkey" FOREIGN KEY ("company_user_id") REFERENCES "company_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_company_user_id_fkey" FOREIGN KEY ("company_user_id") REFERENCES "company_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_attachments" ADD CONSTRAINT "file_attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
