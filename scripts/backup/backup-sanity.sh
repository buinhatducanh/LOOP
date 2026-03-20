#!/usr/bin/env bash
# ─── LOOP Website — Sanity CMS Backup Script ──────────────────────────────────
# Usage:
#   ./scripts/backup/backup-sanity.sh
#
# Required env vars:
#   SANITY_PROJECT_ID    — from sanity.io/manage
#   SANITY_DATASET      — typically "production"
#   SANITY_TOKEN        — read-only API token (generate at sanity.io/manage → API → Tokens)
#   BACKUP_DIR         — local backup directory (default: ./backups/sanity)

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups/sanity}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/sanity_${TIMESTAMP}.tar.gz"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

[[ -z "${SANITY_PROJECT_ID:-}" ]] && err "SANITY_PROJECT_ID is not set"
[[ -z "${SANITY_DATASET:-}" ]] && err "SANITY_DATASET is not set"
[[ -z "${SANITY_TOKEN:-}" ]] && err "SANITY_TOKEN is not set (generate at sanity.io/manage)"

mkdir -p "$BACKUP_DIR"

log "Exporting Sanity dataset: ${SANITY_PROJECT_ID}/${SANITY_DATASET}"

# Sanity's CLI dataset export creates a NdJSON file
# npx sanity dataset export production ./backups/sanity/$(date +%Y%m%d).tar.gz --data
npx sanity@latest dataset export \
  "$SANITY_DATASET" \
  "${BACKUP_DIR}/sanity_${TIMESTAMP}.tar.gz" \
  --project="$SANITY_PROJECT_ID" \
  --token="$SANITY_TOKEN" \
  || err "Sanity export failed"

log "Backup created: ${BACKUP_DIR}/sanity_${TIMESTAMP}.tar.gz"
SIZE=$(du -h "${BACKUP_DIR}/sanity_${TIMESTAMP}.tar.gz" | cut -f1)
log "Size: $SIZE"

# Cleanup old backups (keep last 14 days)
find "$BACKUP_DIR" -name "sanity_*.tar.gz" -mtime +14 -delete
log "Cleanup complete (keeping last 14 days)"
