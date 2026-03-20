# ─── LOOP Website — Multi-stage Dockerfile ───────────────────────────────────────
# Stages:
#   1. deps   — install all npm dependencies (cached in Docker layer)
#   2. builder — run `next build` to generate .next/ output
#   3. runtime — minimal Node.js image serving the built app
#
# Build:  docker build -t loop-website .
# Run:    docker run -p 3000:3000 --env-file .env.local loop-website
# Compose: docker compose up --build
#
# For production with Neon PostgreSQL:
#   docker run -p 3000:3000 \
#     --env-file .env.production \
#     loop-website

# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package.json package-lock.json* ./

# Install dependencies
# If no lock file, install latest (slower, not recommended for prod)
RUN \
  if [ -f package-lock.json ]; then \
    npm ci --ignore-scripts; \
  else \
    npm install --ignore-scripts; \
  fi

# ─── Stage 2: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js application
# NODE_ENV=production enables optimizations (tree-shaking, minification)
RUN NODE_ENV=production npm run build

# ─── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Next.js requires this for proper server-side handling
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Set correct permissions for Next.js standalone output
COPY --from=builder /app/public ./public

# Copy the standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port (Next.js default)
EXPOSE 3000

# Health check — verify the server is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the Next.js server
CMD ["node", "server.js"]
