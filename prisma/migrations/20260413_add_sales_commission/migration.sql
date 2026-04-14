-- Migration: add_sales_commission
-- Adds sales LP commission tracking to Order, Enrollment, TeamMember
-- New model: SalesCommissionEvent

-- ── SalesCommissionEvent ──────────────────────────────────────────────────
CREATE TABLE "sales_commission_events" (
 "id" TEXT NOT NULL,
 "sales_rep_id" TEXT NOT NULL,
 "reference_type" TEXT NOT NULL,
 "reference_id" TEXT NOT NULL,
 "direct_lp" INTEGER NOT NULL DEFAULT 0,
 "addon_lp" INTEGER NOT NULL DEFAULT 0,
 "total_lp" INTEGER NOT NULL,
 "paid_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 "order_id" TEXT,
 "enrollment_id" TEXT,
 CONSTRAINT "sales_commission_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sales_commission_events_sales_rep_id_idx" ON "sales_commission_events"("sales_rep_id");
CREATE INDEX "sales_commission_events_order_id_idx" ON "sales_commission_events"("order_id");
CREATE INDEX "sales_commission_events_enrollment_id_idx" ON "sales_commission_events"("enrollment_id");
CREATE INDEX "sales_commission_events_reference_type_reference_id_idx" ON "sales_commission_events"("reference_type", "reference_id");
CREATE INDEX "sales_commission_events_paid_at_idx" ON "sales_commission_events"("paid_at");

ALTER TABLE "sales_commission_events"
 ADD CONSTRAINT "sales_commission_events_sales_rep_id_fkey"
 FOREIGN KEY ("sales_rep_id") REFERENCES "team_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sales_commission_events"
 ADD CONSTRAINT "sales_commission_events_order_id_fkey"
 FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_commission_events"
 ADD CONSTRAINT "sales_commission_events_enrollment_id_fkey"
 FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Order: sales commission fields ───────────────────────────────────────
ALTER TABLE "orders"
 ADD COLUMN "sales_rep_id" TEXT,
 ADD COLUMN "sales_direct_commission" INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN "sales_addon_commission" INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN "commission_paid" BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN "commission_paid_at" TIMESTAMPTZ;

ALTER TABLE "orders"
 ADD CONSTRAINT "orders_sales_rep_id_fkey"
 FOREIGN KEY ("sales_rep_id") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Enrollment: sales commission fields ──────────────────────────────────
ALTER TABLE "enrollments"
 ADD COLUMN "sales_rep_id" TEXT,
 ADD COLUMN "commission_paid" BOOLEAN NOT NULL DEFAULT false,
 ADD COLUMN "commission_paid_at" TIMESTAMPTZ;

ALTER TABLE "enrollments"
 ADD CONSTRAINT "enrollments_sales_rep_id_fkey"
 FOREIGN KEY ("sales_rep_id") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── TeamMember: commission tracking ──────────────────────────────────────
ALTER TABLE "team_members"
 ADD COLUMN "total_sales_commission" INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN "pending_commission" INTEGER NOT NULL DEFAULT 0,
 ADD COLUMN "completed_commission" INTEGER NOT NULL DEFAULT 0;
