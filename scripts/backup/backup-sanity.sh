#!/usr/bin/env bash
# ─── LOOP Website — Sanity CMS Backup Script ──────────────────────────────────
# Usage:
#   ./scripts/backup/backup-sanity.sh
#
# Required env vars:
#   SANITY_PROJECT_ID    — from sanity.io/manage
#   SANITY_DATASET       — typically "production"
#   SANITY_TOKEN         — read-only API token (generate at sanity.io/manage → API → Tokens)
#   BACKUP_DIR           — local backup directory (default: ./backups/sanity)
#
# What it does:
#   1. Exports the full dataset as NDJSON via Sanity CLI
#   2. Compresses to tar.gz
#   3. Verifies the backup is valid
#   4. Cleans up backups older than 14 days

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups/sanity}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/sanity_${TIMESTAMP}.tar.gz"
NDJSON_FILE="${BACKUP_DIR}/sanity_${TIMESTAMP}.ndjson"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ─── Validate env vars ──────────────────────────────────────────────────────────
[[ -z "${SANITY_PROJECT_ID:-}" ]] && err "SANITY_PROJECT_ID is not set"
[[ -z "${SANITY_DATASET:-}" ]]  && err "SANITY_DATASET is not set"
[[ -z "${SANITY_TOKEN:-}" ]]    && err "SANITY_TOKEN is not set (generate at sanity.io/manage)"

mkdir -p "$BACKUP_DIR"

log "Exporting Sanity dataset: ${SANITY_PROJECT_ID}/${SANITY_DATASET}"

# ─── Export via Sanity CLI ────────────────────────────────────────────────────
# Use local sanity binary if available (faster, version-pinned),
# fall back to npx if not.
SANITY_BIN="node_modules/.bin/sanity"
if [[ -x "$SANITY_BIN" ]]; then
    log "Using local sanity binary: $SANITY_BIN"
    SANITY_CMD="$SANITY_BIN"
else
    warn "Local sanity binary not found — using npx (slower)"
    SANITY_CMD="npx --yes sanity@latest"
fi

# Export as NDJSON (portable, line-delimited JSON)
# --raw: export raw documents without the wrapping dataset export format
# This produces a simple NDJSON file that can be easily re-imported
eval "$SANITY_CMD dataset export \
    '$SANITY_DATASET' \
    '$NDJSON_FILE' \
    --project='$SANITY_PROJECT_ID' \
    --token='$SANITY_TOKEN' \
    --raw" || err "Sanity export failed"

# ─── Verify backup before compressing ─────────────────────────────────────────
if [[ ! -s "$NDJSON_FILE" ]]; then
    err "Export produced an empty file — backup may be corrupted"
fi

RECORD_COUNT=$(wc -l < "$NDJSON_FILE")
if [[ "$RECORD_COUNT" -lt 1 ]]; then
    err "Export has no records — check Sanity credentials"
fi

log "Export verified: $RECORD_COUNT records"

# ─── Compress ─────────────────────────────────────────────────────────────────
log "Compressing to tar.gz..."
tar -czf "$BACKUP_FILE" -C "$BACKUP_DIR" "sanity_${TIMESTAMP}.ndjson"
rm -f "$NDJSON_FILE"   # Clean up uncompressed

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup created: $BACKUP_FILE (${SIZE}, ${RECORD_COUNT} records)"

# ─── Verify compressed backup ───────────────────────────────────────────────────
if ! tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
    err "Compressed backup is corrupted — tar verification failed"
fi
log "Backup integrity verified"

# ─── Cleanup old backups ──────────────────────────────────────────────────────
DELETED=$(find "$BACKUP_DIR" -name "sanity_*.tar.gz" -mtime +14 -print -delete | wc -l)
if [[ "$DELETED" -gt 0 ]]; then
    log "Cleaned up $DELETED old backup(s) (keeping last 14 days)"
else
    log "No old backups to clean up"
fi

# ─── Summary ───────────────────────────────────────────────────────────────────
log "Backup complete"
echo ""
echo "  File:   $BACKUP_FILE"
echo "  Size:   $SIZE"
echo "  Records: $RECORD_COUNT"
echo "  Kept:   last 14 days"
echo ""
