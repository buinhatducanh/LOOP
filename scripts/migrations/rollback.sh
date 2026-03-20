#!/usr/bin/env bash
# ─── LOOP Website — Migration Rollback Script ─────────────────────────────────
#
# ⚠️  IMPORTANT: Prisma migrations are forward-only by design.
#    This script documents the rollback strategy for each migration.
#
# For NEON PostgreSQL, you can use Point-In-Time Recovery (PITR) as a safety net:
#   1. Before running a migration, create a Neon branch (protected backup snapshot)
#   2. If migration fails, promote the branch as your new primary database
#
# Usage:
#   ./scripts/migrations/rollback.sh <migration_name>
#   # Example:
#   ./scripts/migrations/rollback.sh 20260320_add_services_featured
#
# Prerequisites:
#   - Neon Pro/Team plan (for branching + PITR)
#   - pg CLI installed
#   - DATABASE_URL set

set -euo pipefail

MIGRATION="${1:-}"
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

[[ -z "$MIGRATION" ]] && err "Usage: $0 <migration_name>"
[[ -z "${DATABASE_URL:-}" ]] && err "DATABASE_URL is not set"

# ─── Migration → Rollback SQL Map ──────────────────────────────────────────────
# For each migration, document the inverse operation.
# Add new migrations here as they are created.

declare -A ROLLBACK_SQL=(
  # Example entries — replace with actual migrations:
  # ["20260320_add_services_featured"]="ALTER TABLE \"Service\" DROP COLUMN IF EXISTS \"isFeatured\";"
  # ["20260320_add_soft_delete"]="ALTER TABLE \"Service\" DROP COLUMN IF EXISTS \"deletedAt\";"
  # ["20260320_add_audit_log"]="DROP TABLE IF EXISTS \"AuditLog\";"
)

# ─── PITR Rollback (Neon Branching) ──────────────────────────────────────────
# 1. In Neon dashboard, create a branch from the snapshot BEFORE the migration
# 2. Point DATABASE_URL at the branch
# 3. Verify data is correct
# 4. Promote the branch to main

log "Neon PITR Rollback Strategy"
echo ""
echo "  1. Go to https://neon.tech → your project → Branches"
echo "  2. Create a new branch from the time BEFORE this migration:"
echo "     Branch name: rollback-$(date +%Y%m%d)"
echo "     Point-in-time: select a time before migration ran"
echo "  3. Update DATABASE_URL to point to the new branch"
echo "  4. Verify data integrity in the branch"
echo "  5. Promote the branch to main"
echo ""

# ─── SQL Rollback (if applicable) ─────────────────────────────────────────────
if [[ -n "${ROLLBACK_SQL[$MIGRATION]:-}" ]]; then
  warn "Found rollback SQL for: $MIGRATION"
  echo "  SQL: ${ROLLBACK_SQL[$MIGRATION]}"
  echo ""
  read -rp "Run this SQL? (yes/no): " CONFIRM
  if [[ "$CONFIRM" == "yes" ]]; then
    log "Executing rollback SQL..."
    psql "$DATABASE_URL" -c "${ROLLBACK_SQL[$MIGRATION]}" \
      || err "Rollback SQL failed"
    log "Rollback complete!"
  else
    log "Aborted."
  fi
else
  warn "No manual rollback SQL found for: $MIGRATION"
  warn "Use Neon PITR branch strategy above."
fi
