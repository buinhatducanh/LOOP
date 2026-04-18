-- Migration: 20260418_add_member_departments
-- Desc: Add MemberDepartment junction table for multi-department membership
-- Applied via: npx prisma db push --accept-data-loss (dev) + prisma migrate deploy (prod)

-- Step 1: Create MemberDepartment junction table
CREATE TABLE IF NOT EXISTS "member_departments" (
  "id" TEXT NOT NULL DEFAULT (cuid()),
  "member_id" TEXT NOT NULL,
  "department_id" TEXT,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "joined_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE ("member_id", "department_id"),
  FOREIGN KEY ("member_id") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "member_departments_member_id_idx" ON "member_departments"("member_id");
CREATE INDEX IF NOT EXISTS "member_departments_department_id_idx" ON "member_departments"("department_id");

-- Step 2: Backfill junction table from existing departmentId values
-- For each member that has a departmentId FK, create a junction row
INSERT INTO "member_departments" ("id", "member_id", "department_id", "is_primary", "joined_at")
SELECT
  REPLACE(LOWER(HEX(RANDOM_BLOB(16)), -- generate CUID
  tm."id",
  tm."department_id",
  CASE WHEN dm."head_id" = tm."id" THEN true ELSE false END,
  tm."created_at"
FROM "team_members" tm
LEFT JOIN "departments" dm ON dm."id" = tm."department_id"
WHERE tm."department_id" IS NOT NULL
ON CONFLICT ("member_id", "department_id") DO NOTHING;

-- Step 3: Department.memberCount auto-computed from junction table (no change needed in schema, just note for future trigger)
-- Note: The junction table is now the source of truth for department membership.
-- Department.headId FK on Department still tracks department head (1 per department).
