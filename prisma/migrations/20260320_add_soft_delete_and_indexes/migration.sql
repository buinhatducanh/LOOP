-- Migration: 20260320_add_soft_delete_indexes
-- Adds deleted_at columns + 20 performance indexes
-- Safe: Uses CONCURRENTLY for zero-downtime index creation
-- Table names match Prisma @@map names or implicit snake_case model names

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

-- ── Performance indexes (already deployed — kept for reference) ─────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_created      ON orders           (status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_email                ON orders           (customer_email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_status      ON orders           (payment_status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_deleted_at          ON orders           (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contact_status_created     ON contact_messages (status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_token             ON sessions         (token);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_created       ON sessions         (user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_login_history_user_created  ON login_history    (user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_resource_id      ON audit_logs       (resource_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_points_email      ON customer_points   (user_email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_websites_email    ON customer_websites (customer_email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_landing_pages_locale_pub    ON landing_pages    (locale, is_published);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_landing_sections_page      ON landing_sections (page_id, sort_order);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_rewards_status        ON order_rewards    (status, end_date)     WHERE end_date IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reward_tiers_level          ON reward_tiers     (level)              WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feature_variants_act        ON feature_variants  (feature_id, is_active) WHERE is_active = TRUE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_web_templates_cat           ON web_templates    (category, is_active, price);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread        ON notifications    (user_id, is_read, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_point_txn_user              ON point_transactions (customer_point_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ad_watch_user              ON ad_watch_history  (customer_point_id, watched_at DESC);

-- ── ANALYZE for query planner ──────────────────────────────────────────
ANALYZE orders;
ANALYZE contact_messages;
ANALYZE sessions;
ANALYZE login_history;
ANALYZE audit_logs;
ANALYZE customer_points;
ANALYZE customer_websites;
ANALYZE landing_pages;
ANALYZE landing_sections;
