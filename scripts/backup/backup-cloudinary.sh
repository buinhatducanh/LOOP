#!/usr/bin/env bash
# ─── LOOP Website — Cloudinary Media Backup Script ──────────────────────────
# Usage:
#   ./scripts/backup/backup-cloudinary.sh
#
# Downloads all Cloudinary assets to local backup.
# Then optionally syncs to S3/R2.
#
# Required env vars:
#   CLOUDINARY_CLOUD_NAME
#   CLOUDINARY_API_KEY
#   CLOUDINARY_API_SECRET
#   BACKUP_DIR         — default: ./backups/cloudinary
#   AWS_ACCESS_KEY_ID   — optional
#   AWS_S3_BUCKET      — optional

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups/cloudinary}"
TIMESTAMP=$(date +%Y%m%d)
DEST_DIR="${BACKUP_DIR}/${TIMESTAMP}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

[[ -z "${CLOUDINARY_CLOUD_NAME:-}" ]] && err "CLOUDINARY_CLOUD_NAME is not set"

log "Starting Cloudinary backup to: $DEST_DIR"
mkdir -p "$DEST_DIR"

# Use Cloudinary's Admin API to list and download all resources
# Downloads up to 1000 recent resources per call
# For full backup, increase limit or paginate

log "Fetching resource list..."
curl -s \
  --data-urlencode "cloud_name=${CLOUDINARY_CLOUD_NAME}" \
  --data-urlencode "api_key=${CLOUDINARY_API_KEY}" \
  --data-urlencode "timestamp=$(date +%s)" \
  --data-urlencode "tag=loop-backup" \
  --data-urlencode "max_results=500" \
  --data-urlencode "all=true" \
  "https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/image?api_key=${CLOUDINARY_API_KEY}&timestamp=$(date +%s)&tag=loop-backup&max_results=500&signature=$(echo -n "timestamp=$(date +%s)&tag=loop-backup" | openssl sha1 -hmac "${CLOUDINARY_API_SECRET}" -binary | openssl base64)" \
  > "${DEST_DIR}/resources.json" 2>&1 || warn "API list failed (continuing without paginated list)"

# Simple approach: use cloudinary-cli to sync
if command -v cloudinary &>/dev/null; then
  log "Using cloudinary CLI to download assets..."
  cloudinary backup download "$DEST_DIR" --resource-tag loop-backup 2>&1 || warn "Cloudinary CLI backup failed"
else
  warn "cloudinary CLI not installed. Skipping download."
  warn "Install with: npm install -g cloudinary"
fi

# Compress backup
log "Compressing backup..."
tar -czf "${BACKUP_DIR}/cloudinary_${TIMESTAMP}.tar.gz" -C "$BACKUP_DIR" "$TIMESTAMP"
rm -rf "$DEST_DIR"

SIZE=$(du -h "${BACKUP_DIR}/cloudinary_${TIMESTAMP}.tar.gz" | cut -f1)
log "Backup created: ${BACKUP_DIR}/cloudinary_${TIMESTAMP}.tar.gz ($SIZE)"

# Upload to S3 if configured
if [[ -n "${AWS_ACCESS_KEY_ID:-}" && -n "${AWS_S3_BUCKET:-}" ]]; then
  log "Uploading to S3..."
  aws s3 cp "${BACKUP_DIR}/cloudinary_${TIMESTAMP}.tar.gz" \
    "${AWS_S3_BUCKET}/cloudinary/cloudinary_${TIMESTAMP}.tar.gz" \
    || warn "S3 upload failed"
fi

# Cleanup old backups (keep 7 days locally)
find "$BACKUP_DIR" -name "cloudinary_*.tar.gz" -mtime +7 -delete
log "Cleanup complete (keeping last 7 days locally)"
