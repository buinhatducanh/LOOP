-- Migration: add_web_package_fields
-- Created: 2026-04-13
-- Description: Adds fields for web package purchase flow:
-- - PricingWebPackage.templateRepoUrl
-- - CustomerWebsite domain/hosting/Vercel fields + separate expiry timestamps
-- - OrderRevenueLine, Invoice, OrderCostLine for revenue tracking and VAT reporting

-- 1. PricingWebPackage: add template repo URL
ALTER TABLE "pricing_web_packages" ADD COLUMN "template_repo_url" TEXT;

-- 2. CustomerWebsite: add domain purchase info
ALTER TABLE "customer_websites" ADD COLUMN "registered_at" TIMESTAMP(3);
ALTER TABLE "customer_websites" ADD COLUMN "domain_term_months" INTEGER NOT NULL DEFAULT 12;
ALTER TABLE "customer_websites" ADD COLUMN "domain_cost" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "customer_websites" ADD COLUMN "domain_tld" TEXT;

-- 3. CustomerWebsite: add hosting purchase info
ALTER TABLE "customer_websites" ADD COLUMN "hosting_plan_id" TEXT;
ALTER TABLE "customer_websites" ADD COLUMN "hosting_term_months" INTEGER NOT NULL DEFAULT 12;
ALTER TABLE "customer_websites" ADD COLUMN "hosting_cost" INTEGER NOT NULL DEFAULT 0;

-- 4. CustomerWebsite: add Vercel deployment info
ALTER TABLE "customer_websites" ADD COLUMN "vercel_project_id" TEXT;
ALTER TABLE "customer_websites" ADD COLUMN "vercel_project_url" TEXT;

-- 5. CustomerWebsite: add auto-renew flags
ALTER TABLE "customer_websites" ADD COLUMN "auto_renew_domain" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "customer_websites" ADD COLUMN "auto_renew_hosting" BOOLEAN NOT NULL DEFAULT false;

-- 6. CustomerWebsite: add separate expiry timestamps (replaces single expiresAt for domain+hosting)
ALTER TABLE "customer_websites" ADD COLUMN "domain_expires_at" TIMESTAMP(3);
ALTER TABLE "customer_websites" ADD COLUMN "hosting_expires_at" TIMESTAMP(3);

-- 7. CustomerWebsite: add FK to PricingHostingPlan
ALTER TABLE "customer_websites" ADD CONSTRAINT "customer_websites_hosting_plan_id_fkey"
 FOREIGN KEY ("hosting_plan_id") REFERENCES "pricing_hosting_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 8. CustomerWebsite: add indexes for expiry queries
CREATE INDEX "customer_websites_domain_expires_at_idx" ON "customer_websites"("domain_expires_at");
CREATE INDEX "customer_websites_hosting_expires_at_idx" ON "customer_websites"("hosting_expires_at");

-- 9. PricingHostingPlan: add reverse relation to CustomerWebsite
-- (Prisma handles this via the field on CustomerWebsite side, no migration needed for Postgres)

-- 10. OrderRevenueLine: create table for revenue line items
CREATE TABLE "order_revenue_lines" (
 "id" TEXT NOT NULL,
 "order_id" TEXT NOT NULL,
 "category" TEXT NOT NULL,
 "service_name" TEXT NOT NULL,
 "package_ref" TEXT,
 "quantity" INTEGER NOT NULL DEFAULT 1,
 "unit_price" INTEGER NOT NULL,
 "total_price" INTEGER NOT NULL,
 "period_months" INTEGER,
 "taxable" BOOLEAN NOT NULL DEFAULT true,
 "tax_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
 "tax_amount" INTEGER NOT NULL DEFAULT 0,
 "invoice_id" TEXT,
 "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "order_revenue_lines_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "order_revenue_lines" ADD CONSTRAINT "order_revenue_lines_order_id_fkey"
 FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_revenue_lines" ADD CONSTRAINT "order_revenue_lines_invoice_id_fkey"
 FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "order_revenue_lines_order_id_category_idx" ON "order_revenue_lines"("order_id", "category");
CREATE INDEX "order_revenue_lines_category_created_at_idx" ON "order_revenue_lines"("category", "created_at");

-- 11. Invoice: add invoice_serial field for tax reporting
ALTER TABLE "invoices" ADD COLUMN "invoice_serial" TEXT;
CREATE UNIQUE INDEX "invoices_invoice_serial_idx" ON "invoices"("invoice_serial") WHERE "invoice_serial" IS NOT NULL;

-- 12. Invoice: add revenueLines relation (Prisma-only, no migration needed)
-- 13. Order: add revenueLines and costLines relations (Prisma-only, no migration needed)

-- 14. OrderCostLine: create table for cost tracking
CREATE TABLE "order_cost_lines" (
 "id" TEXT NOT NULL,
 "order_id" TEXT NOT NULL,
 "category" TEXT NOT NULL,
 "description" TEXT NOT NULL,
 "amount" INTEGER NOT NULL,
 "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "order_cost_lines_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "order_cost_lines" ADD CONSTRAINT "order_cost_lines_order_id_fkey"
 FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "order_cost_lines_order_id_idx" ON "order_cost_lines"("order_id");
CREATE INDEX "order_cost_lines_category_idx" ON "order_cost_lines"("category");

-- 15. ProjectReview (from migration 20260413_add_project_reviews)
CREATE TABLE IF NOT EXISTS "project_reviews" (
 "id" TEXT NOT NULL,
 "order_id" TEXT NOT NULL,
 "user_id" TEXT NOT NULL,
 "rating" INTEGER NOT NULL,
 "title" TEXT,
 "comment" TEXT,
 "aspects" JSONB,
 "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "project_reviews_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "project_reviews_order_id_user_id_key" ON "project_reviews"("order_id", "user_id");
CREATE INDEX IF NOT EXISTS "project_reviews_user_id_idx" ON "project_reviews"("user_id");
CREATE INDEX IF NOT EXISTS "project_reviews_order_id_idx" ON "project_reviews"("order_id");

-- 16. SupportTicket (from migration 20260413_add_project_reviews)
CREATE TABLE IF NOT EXISTS "support_tickets" (
 "id" TEXT NOT NULL,
 "user_id" TEXT NOT NULL,
 "order_id" TEXT,
 "subject" TEXT NOT NULL,
 "description" TEXT NOT NULL,
 "priority" TEXT NOT NULL DEFAULT 'normal',
 "status" TEXT NOT NULL DEFAULT 'open',
 "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "support_tickets_user_id_idx" ON "support_tickets"("user_id");
CREATE INDEX IF NOT EXISTS "support_tickets_order_id_idx" ON "support_tickets"("order_id");
CREATE INDEX IF NOT EXISTS "support_tickets_status_idx" ON "support_tickets"("status");
