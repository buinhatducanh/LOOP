# Migration Safety Guide

> **Critical for production deployments**

---

## Golden Rules

1. **Never edit a deployed migration file** — once merged to `main`, migration files are immutable
2. **Always backup before migrating** — especially for schema changes
3. **Test on a Neon branch** first
4. **Zero-downtime mindset** — migrations should be backward-compatible

---

## Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/add-user-avatar

# 2. Make schema changes in prisma/schema.prisma
# ...
# npx prisma migrate dev --name add_user_avatar
# → Creates prisma/migrations/TIMESTAMP_add_user_avatar/

# 3. Reset local DB (dev only)
# ⚠️ NEVER run prisma db push --force-reset on production
npm run db:reset

# 4. Run migrations locally
npx prisma migrate dev
```

---

## Production Migration Checklist

```bash
# 1. Backup Neon DB (create a branch/preview)
# Dashboard: Neon → Branches → Create branch → wait for restore

# 2. Run migrations on preview branch
DATABASE_URL="<preview_db_url>" npx prisma migrate deploy

# 3. Verify migration ran successfully
# Check Neon SQL editor:
SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;

# 4. Deploy application
# Merge PR → Vercel auto-deploys

# 5. Monitor Sentry for migration-related errors
```

---

## Safe Migration Patterns

### ✅ Adding a new nullable column
```prisma
// ✅ Safe: column is nullable, no default required
model User {
  bio String?
}
// Migration: ADD COLUMN bio TEXT
// Backward compatible: old code works fine
```

### ✅ Adding a column with a default
```prisma
// ✅ Safe: Prisma adds DEFAULT without locking
model Order {
  notes String @default("")
}
// Migration: ADD COLUMN notes TEXT DEFAULT '' NOT NULL
// Backward compatible: existing rows get default value
```

### ✅ Adding a new table
```prisma
// ✅ Safe: new table doesn't affect existing tables
model RewardTier {
  id String @id @default(cuid())
  name String
}
// Backward compatible: existing queries unaffected
```

### ✅ Adding a new index
```prisma
// ✅ Safe: Postgres builds index concurrently
// Only locks briefly on large tables
@@index([status, createdAt])
```

### ⚠️ Renaming a column (2-step migration)

```prisma
# Step 1 (migrate): Add new column, update code to write to BOTH columns
model User {
  nickname  String?   # NEW column
  # keep old 'name' for now
}

# Step 2 (deploy + verify): App writes to both, reads from old
# → Deploy app

# Step 3 (migrate): Backfill old → new
UPDATE users SET nickname = name WHERE nickname IS NULL;

# Step 4 (migrate): Drop old column
# ⚠️ Requires careful coordination with app deployment
model User {
  nickname String?
  # name removed
}
npx prisma migrate deploy
```

### ❌ Dangerous — Never Do These Without Downtime Window

| Migration | Risk |
|-----------|------|
| `DROP COLUMN` without backup | Data loss |
| `ALTER TYPE` on busy column | Table lock |
| `DROP TABLE` | Data loss |
| Changing column type (e.g., `String` → `Int` | Downtime |
| Adding `NOT NULL` without default | Write failures |

---

## Neon-Specific Notes

### Neon Branches
```bash
# Create a preview branch for testing migrations
# Dashboard: Database → Branching → Create branch

# Test migration on preview
DATABASE_URL="<preview_branch_url>" npx prisma migrate deploy

# Promote preview to production (Neon only, atomic swap)
```

### Connection Pooling
```bash
# Neon uses serverless driver with pooler
# Set connection_limit=1 in connection string for bulk operations:
DATABASE_URL="postgresql://.../?connection_limit=1"
```

---

## Rollback Strategy

### If migration fails mid-deploy

1. **Don't panic** — migrations are idempotent
2. Re-run `npx prisma migrate deploy`
3. If truly broken: restore Neon branch snapshot
4. Check `SELECT * FROM _prisma_migrations` to see state
