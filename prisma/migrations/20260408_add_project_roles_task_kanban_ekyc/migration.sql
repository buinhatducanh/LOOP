-- Migration: 20260408_add_project_roles_task_kanban_ekyc
-- Phase 1 E2E Flow — E2E simulation + automation testing
-- Pushed via `prisma db push` due to shadow DB inconsistency in dev.
-- Schema changes written to this file for migration history only.
-- Models added: ProjectRole, TaskKanban
-- Extended: ProjectMember (projectRoleKey FK), CustomerWebsite (eKYC, configStatus), HandoverPackage (figma/github/scope)

-- ══════════════════════════════════════════════════════════════
-- 1. ProjectRole table
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "project_roles" (
  "id"         TEXT         PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "key"        TEXT         NOT NULL UNIQUE,
  "label"      TEXT         NOT NULL,
  "color"      TEXT         NOT NULL DEFAULT '#3B82F6',
  "sort_order" INTEGER      NOT NULL DEFAULT 0,
  "is_active"  BOOLEAN      NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "project_roles_key_idx" ON "project_roles"("key");

-- Seed project roles
INSERT INTO "project_roles" ("key", "label", "color", "sort_order", "is_active") VALUES
  ('pm',       'Project Manager', '#EC4899', 1, true),
  ('designer', 'Designer',        '#8B5CF6', 2, true),
  ('dev',      'Developer',       '#3B82F6', 3, true),
  ('qa',       'QA Engineer',     '#22C55E', 4, true),
  ('seo',      'SEO Specialist',  '#F59E0B', 5, true)
ON CONFLICT ("key") DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- 2. TaskKanban table — task-level Kanban per Order
-- ══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "task_kanban" (
  "id"          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "order_id"    TEXT        NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "column"      TEXT        NOT NULL DEFAULT 'backlog',
  "title"       TEXT        NOT NULL,
  "description" TEXT,
  "priority"    TEXT        NOT NULL DEFAULT 'medium',
  "lp"          INTEGER     NOT NULL DEFAULT 0,
  "branch_name" TEXT,
  "github_link" TEXT,
  "assignee_id" TEXT,
  "qa_id"       TEXT,
  "env_file_id" TEXT,
  "completed_at" TIMESTAMPTZ,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "task_kanban_order_column_idx" ON "task_kanban"("order_id", "column");
CREATE INDEX IF NOT EXISTS "task_kanban_assignee_idx"     ON "task_kanban"("assignee_id");
CREATE INDEX IF NOT EXISTS "task_kanban_qa_idx"           ON "task_kanban"("qa_id");

-- ══════════════════════════════════════════════════════════════
-- 3. ProjectMember — add projectRoleKey FK
-- ══════════════════════════════════════════════════════════════
-- Check if projectRoleKey already exists before adding
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'project_members' AND column_name = 'project_role_key') THEN
    ALTER TABLE "project_members" ADD COLUMN "project_role_key" TEXT REFERENCES "project_roles"("key");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "project_members_project_role_key_idx" ON "project_members"("project_role_key");

-- ══════════════════════════════════════════════════════════════
-- 4. CustomerWebsite — add eKYC fields, configStatus, packageId, deployedUrl
-- Remove domain unique constraint (multiple websites without domain allowed)
-- ══════════════════════════════════════════════════════════════
DO $$
BEGIN
  -- Add columns that don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_websites' AND column_name = 'config_status') THEN
    ALTER TABLE "customer_websites" ADD COLUMN "config_status" TEXT NOT NULL DEFAULT 'pending_config';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_websites' AND column_name = 'deployed_url') THEN
    ALTER TABLE "customer_websites" ADD COLUMN "deployed_url" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_websites' AND column_name = 'package_id') THEN
    ALTER TABLE "customer_websites" ADD COLUMN "package_id" TEXT REFERENCES "pricing_web_packages"("id");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_websites' AND column_name = 'ekyc_name') THEN
    ALTER TABLE "customer_websites" ADD COLUMN "ekyc_name" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_websites' AND column_name = 'ekyc_id_number') THEN
    ALTER TABLE "customer_websites" ADD COLUMN "ekyc_id_number" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_websites' AND column_name = 'ekyc_dob') THEN
    ALTER TABLE "customer_websites" ADD COLUMN "ekyc_dob" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_websites' AND column_name = 'ekyc_address') THEN
    ALTER TABLE "customer_websites" ADD COLUMN "ekyc_address" TEXT;
  END IF;

  -- Make domain nullable (was unique)
  ALTER TABLE "customer_websites" ALTER COLUMN "domain" DROP NOT NULL;
  -- Drop unique constraint if it exists
  ALTER TABLE "customer_websites" DROP CONSTRAINT IF EXISTS "customer_websites_domain_key";
END $$;

-- ══════════════════════════════════════════════════════════════
-- 5. HandoverPackage — add figma/github/scope/customerNotes/adminNotes
-- ══════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'handover_packages' AND column_name = 'figma_url') THEN
    ALTER TABLE "handover_packages" ADD COLUMN "figma_url" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'handover_packages' AND column_name = 'github_url') THEN
    ALTER TABLE "handover_packages" ADD COLUMN "github_url" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'handover_packages' AND column_name = 'deployment_url') THEN
    ALTER TABLE "handover_packages" ADD COLUMN "deployment_url" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'handover_packages' AND column_name = 'scope') THEN
    ALTER TABLE "handover_packages" ADD COLUMN "scope" JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'handover_packages' AND column_name = 'customer_notes') THEN
    ALTER TABLE "handover_packages" ADD COLUMN "customer_notes" TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'handover_packages' AND column_name = 'admin_notes') THEN
    ALTER TABLE "handover_packages" ADD COLUMN "admin_notes" TEXT;
  END IF;
END $$;