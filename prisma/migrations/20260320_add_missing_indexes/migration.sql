-- Migration: 20260320_add_missing_indexes
-- Adds indexes for high-frequency query patterns found by codebase audit
-- Covers: User.isActive/accountType, Service.category/isActive,
--         TeamMember.roleLevel/isFeatured/isWorking, Testimonial.isActive,
--         HomeSlider/HomeVideo/WebTemplate/PricingPlan/AddonService isActive+sortOrder,
--         ServiceAttribute.isRequired, FeatureGroup.isActive, Feature.isActive,
--         AuditLog.action, QuoteRequest.status, Order.orderNumber
--         Permission (resource,action), PricingWebPackage.isActive
--         WebsiteStats for analytics, FeatureVariant.isActive, Advertisement.isActive
--         DailyReward, PointTransaction.type, AdWatchHistory.advertisementId

-- ── Users ──────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_active      ON users      (is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_account_type   ON users      (account_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at    ON users      (created_at);

-- ── Sessions ────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_token_lookup ON sessions  (token);

-- ── Team Members ────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_is_active    ON team_members  (is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_sort_order   ON team_members  (sort_order);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_role_level   ON team_members  (role_level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_is_featured  ON team_members  (is_featured);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_is_working    ON team_members  (is_working);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_created_at    ON team_members  (created_at);

-- ── Projects ────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_is_published  ON projects  (is_published);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_service_id    ON projects  (service_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_team_member    ON projects  (team_member_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_created_at    ON projects  (created_at);

-- ── Services ────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_is_active   ON services  (is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_sort_order  ON services  (sort_order);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_category    ON services  (category);

-- ── Testimonials ────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_testimonials_is_active  ON testimonials (is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_testimonials_sort_order ON testimonials (sort_order);

-- ── Contact Messages ────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contact_messages_status    ON contact_messages (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contact_messages_created_at ON contact_messages (created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contact_messages_email     ON contact_messages (email);

-- ── Quote Requests ──────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quote_requests_status    ON quote_requests (status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quote_requests_created_at ON quote_requests (created_at);

-- ── Permissions ─────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permissions_resource_action ON permissions (resource, action);

-- ── Audit Logs ──────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);

-- ── Orders ──────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_order_number    ON orders (order_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_status_d ON orders (payment_status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_order_type      ON orders (order_type, status);

-- ── Web Templates ───────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_web_templates_is_active_sort ON web_templates (is_active, sort_order);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_web_templates_level         ON web_templates (level, is_active);

-- ── Service Attributes ──────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_attributes_required  ON service_attributes (is_required);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_attributes_active_sort ON service_attributes (is_active, sort_order);

-- ── Feature Groups ──────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feature_groups_is_active ON feature_groups (is_active, sort_order);

-- ── Features ────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_features_is_active ON features (is_active, sort_order);

-- ── Feature Variants ───────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feature_variants_is_active ON feature_variants (is_active, sort_order);

-- ── Pricing Plans ───────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pricing_plans_is_active_sort ON pricing_plans (is_active, sort_order);

-- ── Pricing Web Packages ────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pricing_web_packages_active ON pricing_web_packages (is_active, sort_order);

-- ── Addon Services ──────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_addon_services_is_active_sort ON addon_services (is_active, sort_order);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_addon_services_type           ON addon_services (type);

-- ── Home Slider ─────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_home_sliders_active_sort ON home_sliders (is_active, sort_order);

-- ── Home Video ──────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_home_videos_active_sort ON home_videos (is_active, sort_order);

-- ── Advertisements ──────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_advertisements_active ON advertisements (is_active, sort_order);

-- ── Daily Rewards ───────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_daily_rewards_is_active ON daily_rewards (is_active);

-- ── Point Transactions ──────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_point_transactions_type_created ON point_transactions (type, created_at);

-- ── Ad Watch History ───────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ad_watch_ad_id ON ad_watch_history (advertisement_id);

-- ── ANALYZE ────────────────────────────────────────────────────────────
ANALYZE users;
ANALYZE team_members;
ANALYZE projects;
ANALYZE services;
ANALYZE testimonials;
ANALYZE contact_messages;
ANALYZE quote_requests;
ANALYZE permissions;
ANALYZE audit_logs;
ANALYZE orders;
ANALYZE web_templates;
ANALYZE service_attributes;
ANALYZE feature_groups;
ANALYZE features;
ANALYZE feature_variants;
ANALYZE pricing_plans;
ANALYZE pricing_web_packages;
ANALYZE addon_services;
ANALYZE home_sliders;
ANALYZE home_videos;
ANALYZE advertisements;
ANALYZE daily_rewards;
ANALYZE point_transactions;
ANALYZE ad_watch_history;
