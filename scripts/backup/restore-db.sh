#!/usr/bin/env bash
# ─── LOOP Website — Database Restore Script ──────────────────────────────────
# Usage:
#   ./scripts/backup/restore-db.sh ./backups/loop_db_20260320_120000.sql.gz
#
# ⚠️  WARNING: This drops and recreates ALL data in the database.
#    Only use on development/staging databases, never production.
#
# Required env vars:
#   DATABASE_URL — Neon connection string (must have write access)

set -euo pipefail

BACKUP_FILE="${1:-}"
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

[[ -z "$BACKUP_FILE" ]] && err "Usage: $0 <backup_file.sql.gz>"
[[ ! -f "$BACKUP_FILE" ]] && err "File not found: $BACKUP_FILE"
[[ -z "${DATABASE_URL:-}" ]] && err "DATABASE_URL is not set"

# Confirm before destructive operation
echo ""
warn "⚠️  This will OVERWRITE all data in the database."
warn "  File: $BACKUP_FILE"
echo ""
read -rp "Type 'yes' to confirm: " CONFIRM
[[ "$CONFIRM" == "yes" ]] || { echo "Aborted."; exit 0; }

log "Decompressing backup..."
DECOMPRESSED="${BACKUP_FILE%.gz}"
gunzip -k "$BACKUP_FILE"

log "Restoring database (this may take several minutes)..."
pg_restore \
  "$DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --dbname="${DATABASE_URL##*/}" \
  "$DECOMPRESSED" || err "pg_restore failed"

rm -f "$DECOMPRESSED"

log "✅ Restore complete!"
