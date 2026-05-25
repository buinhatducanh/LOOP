-- Migration: 20260512_add_revenue_split_off_system_models
-- Desc: Add RevenueSplitConfig, OffSystemPayment, OffSystemSplit, PermissionAudit models
-- Used by: Revenue Split % per role (CEO config) + Off-System Payment LP auto-split + Approve workflow

BEGIN;

-- ─── RevenueSplitConfig ────────────────────────────────────────────────────────
-- Cấu hình % chia doanh thu theo role. Seed: pm=35%, dev=25%, qa=15%, design=15%, seo=10%, company=0%.
CREATE TABLE IF NOT EXISTS "revenue_split_configs" (
  "id" TEXT NOT NULL DEFAULT (cuid()),
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE ("key")
);

-- ─── OffSystemPayment ─────────────────────────────────────────────────────────
-- Ghi nhận chi phí/thu ngoài hệ thống Order (dự án Freelance, chi phí văn phòng...)
CREATE TABLE IF NOT EXISTS "off_system_payments" (
  "id" TEXT NOT NULL DEFAULT (cuid()),
  "order_id" TEXT,
  "amount_vnd" DOUBLE PRECISION NOT NULL,
  "lp_rate" DOUBLE PRECISION NOT NULL,
  "total_lp" INTEGER NOT NULL,
  "description" TEXT,
  "note" TEXT,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "off_system_payments_order_id_idx" ON "off_system_payments"("order_id");
CREATE INDEX IF NOT EXISTS "off_system_payments_created_at_idx" ON "off_system_payments"("created_at");

-- ─── OffSystemSplit ───────────────────────────────────────────────────────────
-- LP chia cho từng role — PM/Admin/CEO duyệt → credit vào TeamMember.availableLp
CREATE TABLE IF NOT EXISTS "off_system_splits" (
  "id" TEXT NOT NULL DEFAULT (cuid()),
  "off_system_payment_id" TEXT NOT NULL,
  "member_id" TEXT NOT NULL,
  "project_role" TEXT NOT NULL,
  "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lp_amount" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "approved_by" TEXT,
  "approved_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("off_system_payment_id") REFERENCES "off_system_payments"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "off_system_splits_off_system_payment_id_idx" ON "off_system_splits"("off_system_payment_id");
CREATE INDEX IF NOT EXISTS "off_system_splits_member_id_idx" ON "off_system_splits"("member_id");
CREATE INDEX IF NOT EXISTS "off_system_splits_status_idx" ON "off_system_splits"("status");

-- ─── PermissionAudit ──────────────────────────────────────────────────────────
-- Audit log cho việc CEO gán permissions cho member
CREATE TABLE IF NOT EXISTS "permission_audits" (
  "id" TEXT NOT NULL DEFAULT (cuid()),
  "target_user_id" TEXT NOT NULL,
  "granted_by" TEXT NOT NULL,
  "permission" TEXT NOT NULL,
  "department" TEXT,
  "action" TEXT NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "permission_audits_target_user_id_idx" ON "permission_audits"("target_user_id");

-- ─── Seed: RevenueSplitConfig ─────────────────────────────────────────────────
-- Tỷ lệ chia LP cho Off-System Payment (pm trừ ra trước, phần còn lại chia theo %)
INSERT INTO "revenue_split_configs" ("id", "key", "label", "percentage", "is_active", "created_at", "updated_at")
VALUES
  ((cuid()), 'pm',      'Project Manager', 35.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ((cuid()), 'dev',     'Developer',       25.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ((cuid()), 'qa',      'QA Engineer',     15.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ((cuid()), 'design',  'Designer',        15.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ((cuid()), 'seo',     'SEO Specialist',  10.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

COMMIT;
