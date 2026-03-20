-- Migration: 20260321_add_server_analytics_events
-- Adds ServerAnalyticsEvent table for business intelligence / analytics dashboards.
-- Created by: src/lib/analytics/server.ts
-- NOTE: Optional table — analytics pipeline falls back to AuditLog if this is not migrated.

-- ── ServerAnalyticsEvent ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "server_analytics_events" (
    "id"          TEXT         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "event"       TEXT         NOT NULL,
    "properties"  JSONB        NOT NULL DEFAULT '{}',
    "session_id"  TEXT,
    "visitor_id"  TEXT,
    "user_id"     TEXT,
    "locale"      TEXT,
    "page"        TEXT,
    "referrer"    TEXT,
    "user_agent"  TEXT,
    "ip"          TEXT,
    "country"     TEXT,
    "city"        TEXT,
    "device"      TEXT,
    "browser"     TEXT,
    "os"          TEXT,
    "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "idx_server_analytics_events_event"       ON "server_analytics_events" ("event");
CREATE INDEX IF NOT EXISTS "idx_server_analytics_events_created_at" ON "server_analytics_events" ("created_at");
CREATE INDEX IF NOT EXISTS "idx_server_analytics_events_session_id" ON "server_analytics_events" ("session_id");

-- ── ANALYZE ───────────────────────────────────────────────────────────────
ANALYZE "server_analytics_events";
