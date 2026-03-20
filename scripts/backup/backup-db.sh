#!/usr/bin/env bash
# ─── LOOP Website — Database Backup Script ───────────────────────────────────────
# Usage:
#   ./scripts/backup/backup-db.sh            # local backup
#   ./scripts/backup/backup-db.sh --upload  # backup + upload to S3/R2
#
# Required env vars (set in .env or .env.backup):
#   DATABASE_URL        — Neon connection string
#   BACKUP_DIR        — local backup directory (default: ./backups)
#   AWS_ACCESS_KEY_ID  — for S3/R2 upload (optional)
#   AWS_SECRET_ACCESS_KEY
#   AWS_S3_BUCKET      — e.g. s3://loop-backups
#   BACKUP_RETENTION_DAYS — days to keep local backups (default: 30)

set -euo pipefail

# ─── Config ────────────────────────────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="loop_db_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# ─── Colors ─────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ─── Checks ─────────────────────────────────────────────────────────────────────
[[ -z "${DATABASE_URL:-}" ]] && err "DATABASE_URL is not set"

# Extract host from DATABASE_URL for pg_dump
PG_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
PG_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
PG_DB=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\).*|\1|p')
PG_USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')

log "Backup config:"
log "  Host:     $PG_HOST"
log "  Database: $PG_DB"
log "  Output:   $BACKUP_PATH"

# ─── Create backup directory ────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

# ─── Run pg_dump ────────────────────────────────────────────────────────────────
log "Starting PostgreSQL backup..."
pg_dump \
  "$DATABASE_URL" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-acl \
  --file="${BACKUP_PATH%.gz}" || err "pg_dump failed"

# Compress the backup
gzip -9 "${BACKUP_PATH%.gz}"
log "Backup created: ${BACKUP_PATH}"

# ─── Upload to S3/R2 (optional) ───────────────────────────────────────────────
if [[ -n "${AWS_ACCESS_KEY_ID:-}" && -n "${AWS_S3_BUCKET:-}" ]]; then
  log "Uploading to S3: $AWS_S3_BUCKET/$(basename "$BACKUP_PATH")"
  aws s3 cp "$BACKUP_PATH" "${AWS_S3_BUCKET}/db/$(basename "$BACKUP_PATH")" \
    --storage-class STANDARD_IA \
    || warn "S3 upload failed (backup is local: $BACKUP_PATH)"
else
  warn "S3 credentials not set — skipping upload. Set AWS_ACCESS_KEY_ID + AWS_S3_BUCKET to enable."
fi

# ─── Cleanup old local backups ─────────────────────────────────────────────────
log "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "loop_db_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete
REMOVED=$(find "$BACKUP_DIR" -name "loop_db_*.sql.gz" -mtime "+${RETENTION_DAYS}" -print 2>/dev/null || true)
if [[ -z "$REMOVED" ]]; then
  log "No old backups to remove."
else
  log "Removed: $REMOVED"
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
log "Done! Backup size: $SIZE"
log "Local path: $BACKUP_PATH"
