-- Migration: 20260320_add_soft_delete_indexes
-- Adds deleted_at columns + partial indexes for soft delete pattern
-- NOTE: CONCURRENTLY removed — Prisma wraps migrations in transactions

-- ── Soft Delete columns ──────────────────────────────────────────────────
ALTER TABLE services          ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE projects           ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE testimonials       ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE team_members       ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE orders             ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE contact_messages   ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE site_settings      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE web_templates      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE reward_tiers       ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ── Partial indexes for soft delete (only non-deleted rows) ─────────────
CREATE INDEX idx_orders_deleted_at          ON orders           (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_order_rewards_status        ON order_rewards    (status, end_date)     WHERE end_date IS NOT NULL;
CREATE INDEX idx_reward_tiers_level          ON reward_tiers     (level)              WHERE is_active = TRUE;
CREATE INDEX idx_feature_variants_act        ON feature_variants  (feature_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_notifications_unread        ON notifications    (user_id, is_read, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX idx_point_txn_user              ON point_transactions (customer_point_id, created_at DESC);
CREATE INDEX idx_ad_watch_user              ON ad_watch_history  (customer_point_id, watched_at DESC);
