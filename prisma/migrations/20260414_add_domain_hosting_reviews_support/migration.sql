-- Migration: add_domain_hosting_reviews_support
-- Adds: domain/hosting purchase fields to CustomerWebsite,
-- PricingHostingPlan relation, ProjectReview, SupportTicket, OrderRevenueLine models

-- 1. CustomerWebsite: add domain purchase fields
ALTER TABLE "customer_websites" ADD COLUMN "registered_at" TIMESTAMP;
ALTER TABLE "customer_websites" ADD COLUMN "domain_term_months" INTEGER;
ALTER TABLE "customer_websites" ADD COLUMN "domain_cost" DOUBLE PRECISION;
ALTER TABLE "customer_websites" ADD COLUMN "domain_tld" TEXT;
ALTER TABLE "customer_websites" ADD COLUMN "auto_renew_domain" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "customer_websites" ADD COLUMN "domain_expires_at" TIMESTAMP;

-- 2. CustomerWebsite: add hosting purchase fields
ALTER TABLE "customer_websites" ADD COLUMN "hosting_plan_id" TEXT;
ALTER TABLE "customer_websites" ADD COLUMN "hosting_term_months" INTEGER;
ALTER TABLE "customer_websites" ADD COLUMN "hosting_cost" DOUBLE PRECISION;
ALTER TABLE "customer_websites" ADD COLUMN "auto_renew_hosting" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "customer_websites" ADD COLUMN "hosting_expires_at" TIMESTAMP;

-- 3. Add FK constraint for hostingPlanId -> pricing_hosting_plans
ALTER TABLE "customer_websites" ADD CONSTRAINT "customer_websites_hosting_plan_id_fkey"
 FOREIGN KEY ("hosting_plan_id") REFERENCES "pricing_hosting_plans"("id")
 ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. ProjectReview model
CREATE TABLE "project_reviews" (
 "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
 "order_id" TEXT NOT NULL,
 "user_id" TEXT NOT NULL,
 "rating" INTEGER NOT NULL,
 "title" TEXT,
 "comment" TEXT,
 "aspects" JSONB,
 "created_at" TIMESTAMP NOT NULL DEFAULT now(),
 "updated_at" TIMESTAMP NOT NULL,
 PRIMARY KEY ("id")
);
ALTER TABLE "project_reviews" ADD CONSTRAINT "project_reviews_order_id_fkey"
 FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_reviews" ADD CONSTRAINT "project_reviews_user_id_fkey"
 FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_reviews" ADD CONSTRAINT "project_reviews_order_id_user_id_unique"
 UNIQUE ("order_id", "user_id");
CREATE INDEX "project_reviews_user_id_idx" ON "project_reviews"("user_id");
CREATE INDEX "project_reviews_order_id_idx" ON "project_reviews"("order_id");

-- 5. SupportTicket model
CREATE TABLE "support_tickets" (
 "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
 "user_id" TEXT NOT NULL,
 "order_id" TEXT,
 "subject" TEXT NOT NULL,
 "description" TEXT NOT NULL,
 "priority" TEXT NOT NULL DEFAULT 'normal',
 "status" TEXT NOT NULL DEFAULT 'open',
 "created_at" TIMESTAMP NOT NULL DEFAULT now(),
 "updated_at" TIMESTAMP NOT NULL,
 PRIMARY KEY ("id")
);
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey"
 FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_order_id_fkey"
 FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "support_tickets_user_id_idx" ON "support_tickets"("user_id");
CREATE INDEX "support_tickets_order_id_idx" ON "support_tickets"("order_id");
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- 6. OrderRevenueLine model
CREATE TABLE "order_revenue_lines" (
 "id" TEXT NOT NULL DEFAULT uuid_generate_v4(),
 "order_id" TEXT NOT NULL,
 "category" TEXT NOT NULL,
 "service_name" TEXT NOT NULL,
 "package_ref" TEXT,
 "quantity" INTEGER NOT NULL DEFAULT 1,
 "unit_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
 "total_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
 "period_months" INTEGER,
 "taxable" BOOLEAN NOT NULL DEFAULT true,
 "tax_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
 "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
 "created_at" TIMESTAMP NOT NULL DEFAULT now(),
 "updated_at" TIMESTAMP NOT NULL,
 PRIMARY KEY ("id")
);
ALTER TABLE "order_revenue_lines" ADD CONSTRAINT "order_revenue_lines_order_id_fkey"
 FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "order_revenue_lines_order_id_idx" ON "order_revenue_lines"("order_id");
CREATE INDEX "order_revenue_lines_category_idx" ON "order_revenue_lines"("category");
