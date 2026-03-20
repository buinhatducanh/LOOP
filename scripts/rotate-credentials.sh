#!/usr/bin/env bash
# ─── LOOP Website — Credential Rotation Script ─────────────────────────────────
# Usage:
#   ./scripts/rotate-credentials.sh
#
# What it does:
#   1. Generates new secure values for each secret
#   2. Prints old vs new values (for manual update in providers)
#   3. Updates .env.local with new values
#   4. Provides step-by-step instructions for each provider
#
# IMPORTANT:
#   After running, you MUST update the credentials in each provider's dashboard
#   before deploying. Follow the provider-specific steps below.
#
# Rotate credentials IN ORDER (1 → 2 → 3 → ...), updating providers as you go.
# Keep old credentials valid until new ones are deployed.

set -euo pipefail

ENV_FILE=".env.local"
BACKUP_FILE="${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
step()  { echo -e "\n${CYAN}[STEP]${NC}  $*"; }
err()   { echo -e "${RED}[ERROR]${NC}  $*" >&2; exit 1; }

# ─── Backup ────────────────────────────────────────────────────────────────
info "Backing up current .env.local → $BACKUP_FILE"
cp "$ENV_FILE" "$BACKUP_FILE"

# ─── Generator helpers ────────────────────────────────────────────────────────
gen_secret_32() { openssl rand -base64 32 | tr -d '\n'; }
gen_token_64()    { openssl rand -base64 48 | tr -d '\n'; }
gen_uuid()        { uuidgen 2>/dev/null || cat /proc/sys/kernel/random/uuid; }

# ─── Step 1: AUTH_SECRET ────────────────────────────────────────────────
step "1 / 6: AUTH_SECRET (NextAuth)"
NEW_AUTH_SECRET=$(gen_secret_32)
sed -i.bak "s/^AUTH_SECRET=.*/AUTH_SECRET=\"$NEW_AUTH_SECRET\"/" "$ENV_FILE"
info "AUTH_SECRET rotated"
echo "  → Update: NextAuth will reject old sessions. All users must re-login."
echo "  → Old value: backup in $BACKUP_FILE"

# ─── Step 2: DATABASE_URL ──────────────────────────────────────────────
step "2 / 6: DATABASE_URL (Neon PostgreSQL)"
echo ""
echo "  ⚠️  DATABASE_URL rotation REQUIRES downtime."
echo "  Steps:"
echo "    1. Go to: https://neon.tech → your project → Connection Details"
echo "    2. Click 'Rotate password'"
echo "    3. Copy the new connection string"
echo "    4. Paste it below (or edit .env.local manually)"
echo ""
read -rp "  Paste new DATABASE_URL (or Enter to skip): " new_db
if [[ -n "$new_db" ]]; then
    sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=\"$new_db\"|" "$ENV_FILE"
    info "DATABASE_URL updated"
fi

# ─── Step 3: GOOGLE OAuth ───────────────────────────────────────────────
step "3 / 6: GOOGLE OAUTH (Google Cloud Console)"
NEW_GOOGLE_SECRET=$(gen_token_64)
sed -i.bak "s/^GOOGLE_CLIENT_SECRET=.*/GOOGLE_CLIENT_SECRET=\"$NEW_GOOGLE_SECRET\"/" "$ENV_FILE"
info "GOOGLE_CLIENT_SECRET rotated"
echo "  Steps:"
echo "    1. https://console.cloud.google.com/apis/credentials"
echo "    2. Find your OAuth 2.0 Client ID"
echo "    3. Actions → Edit → Update Client Secret"
echo "    4. Copy new secret from Google Console"
echo "    5. Update GOOGLE_CLIENT_SECRET in .env.local"
echo "    6. Deploy to update production"

# ─── Step 4: CLOUDINARY ────────────────────────────────────────────────
step "4 / 6: CLOUDINARY"
NEW_CLOUDINARY_KEY=$(openssl rand -hex 16)
NEW_CLOUDINARY_SECRET=$(gen_token_64)
sed -i.bak \
    -e "s/^CLOUDINARY_API_KEY=.*/CLOUDINARY_API_KEY=\"$NEW_CLOUDINARY_KEY\"/" \
    -e "s/^CLOUDINARY_API_SECRET=.*/CLOUDINARY_API_SECRET=\"$NEW_CLOUDINARY_SECRET\"/" \
    "$ENV_FILE"
info "CLOUDINARY credentials rotated"
echo "  Steps:"
echo "    1. https://console.cloudinary.com/settings/api-keys"
echo "    2. Click 'Regenerate API Key'"
echo "    3. Update CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET"

# ─── Step 5: SENTRY_DSN ───────────────────────────────────────────────
step "5 / 6: SENTRY_DSN"
NEW_SENTRY_DSN="https://$(gen_uuid)@o000000.ingest.sentry.io/0000000"
sed -i.bak "s/^SENTRY_DSN=.*/SENTRY_DSN=\"$NEW_SENTRY_DSN\"/" "$ENV_FILE"
info "SENTRY_DSN placeholder updated"
echo "  Steps:"
echo "    1. https://sentry.io → your project → Settings → Client Keys (DSN)"
echo "    2. Copy the DSN and update SENTRY_DSN in .env.local"
echo "    3. Old DSN keys will stop receiving errors immediately"

# ─── Step 6: UPSTASH REDIS ────────────────────────────────────────────
step "6 / 6: UPSTASH REDIS"
sed -i.bak "s|^UPSTASH_REDIS_REST_URL=.*|UPSTASH_REDIS_REST_URL=\"https://your-redis.upstash.io\"|" "$ENV_FILE"
sed -i.bak "s|^UPSTASH_REDIS_REST_TOKEN=.*|UPSTASH_REDIS_REST_TOKEN=\"your_token\"|" "$ENV_FILE"
info "UPSTASH placeholders updated"
echo "  Steps:"
echo "    1. https://console.upstash.com → Redis → your database"
echo "    2. REST API → Copy URL + Token"
echo "    3. Update UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN"

# ─── Summary ─────────────────────────────────────────────────────────
echo ""
info "Rotation complete. Backup: $BACKUP_FILE"
echo ""
echo "NEXT STEPS:"
echo "  1. Update each provider with the new credentials above"
echo "  2. Deploy the updated .env.local to production"
echo "  3. Verify services work (health check, login, uploads)"
echo "  4. Revoke old credentials in each provider's dashboard"
echo "  5. Delete $BACKUP_FILE after confirming everything works"
echo ""
warn "Keep $BACKUP_FILE until all new credentials are verified working."
