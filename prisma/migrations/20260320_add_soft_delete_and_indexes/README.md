# Migration: Add Soft Delete + Performance Indexes

## What this migration does

### 1. Soft Delete (`deleted_at` column)
Adds `deleted_at TIMESTAMPTZ` column to 9 content/sales models:

- `services`
- `projects`
- `testimonials`
- `team_members`
- `orders`
- `contact_messages`
- `site_settings`

**Usage pattern after migration:**

```ts
// Soft delete — set deletedAt instead of hard delete
await prisma.service.update({
  where: { id },
  data: { deletedAt: new Date() },
});

// Query — always filter deletedAt null
await prisma.service.findMany({
  where: { isActive: true, deletedAt: null },
});
```

### 2. Performance Indexes (20 indexes)

| Index | Table | Query Pattern |
|--------|-------|---------------|
| `idx_orders_status_created_at` | orders | Admin sales dashboard filters |
| `idx_orders_customer_email` | orders | Customer lookup |
| `idx_orders_payment_status` | orders | Payment filters |
| `idx_contact_messages_status_created_at` | contact_messages | Inbox filtering |
| `idx_sessions_token` | sessions | Token lookup |
| `idx_sessions_user_id_created_at` | sessions | User session list |
| `idx_login_history_user_id_created_at` | login_history | Login audit |
| `idx_audit_logs_resource_id` | audit_logs | Resource audit trail |
| `idx_customer_points_email` | customer_points | Point balance lookup |
| `idx_customer_websites_email` | customer_websites | Customer sites |
| `idx_landing_pages_locale_published` | landing_pages | Locale + published filter |
| `idx_landing_sections_page_sort` | landing_sections | Section ordering |
| `idx_order_rewards_status_end_date` | order_rewards | Expiry cron |
| `idx_reward_tiers_level_active` | reward_tiers | Level lookup |
| `idx_feature_variants_active_price` | feature_variants | Pricing calculator |
| `idx_web_templates_category_active_price` | web_templates | Template catalog |
| `idx_notifications_user_unread` | notifications | Unread badge |
| `idx_point_transactions_user_created` | point_transactions | Transaction history |
| `idx_ad_watch_history_user_recent` | ad_watch_history | Recent watches |

## Run

```bash
psql "$DATABASE_URL" -f prisma/migrations/20260320_add_soft_delete_and_indexes/migration.sql
```

## Rollback

```bash
psql "$DATABASE_URL" -f scripts/migrations/rollback.sh 20260320_add_soft_delete_and_indexes
```
