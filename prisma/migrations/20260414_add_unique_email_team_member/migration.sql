-- Add UNIQUE constraint on TeamMember.email
-- Step 1: Handle existing duplicates
-- Strategy: keep CEO (role = 'ceo') if exists, else lowest role_level, else lowest id
-- Phase A: Null email of non-CEO records where a CEO record shares the same email
UPDATE "TeamMember" tm
SET email = NULL
WHERE email IS NOT NULL
AND EXISTS (
 SELECT 1 FROM "TeamMember" ceo
 WHERE ceo.email = tm.email
 AND ceo.id != tm.id
 AND ceo.role = 'ceo'
);

-- Phase B: For remaining duplicates (same role_level), keep lowest id
UPDATE "TeamMember" tm
SET email = NULL
WHERE email IS NOT NULL
AND EXISTS (
 SELECT 1 FROM "TeamMember" other
 WHERE other.email = tm.email
 AND other.id != tm.id
 AND (
 other.role_level < tm.role_level
 OR (other.role_level = tm.role_level AND other.id < tm.id)
 )
);

-- Step 2: Add unique constraint (safe now that duplicates resolved)
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_email_key" UNIQUE ("email");
