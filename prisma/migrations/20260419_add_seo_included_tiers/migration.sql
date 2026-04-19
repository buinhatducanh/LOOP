-- Migration: 20260419_add_seo_included_tiers
-- Add included_tiers column to service_attributes for SEO feature matrix

BEGIN;

-- Add included_tiers column
ALTER TABLE service_attributes ADD COLUMN IF NOT EXISTS included_tiers TEXT;

-- Make sure JSON strings are valid JSON by setting empty string as default placeholder
-- (data will be stored as JSON arrays like "[1,2,3]" via upsert)

COMMIT;
