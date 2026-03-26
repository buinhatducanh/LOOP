# Docker Compose Guide

> **Updated:** 2026-03-26 | **Status:** ✅ Implemented (`docker-compose.yml`)

---

## What Exists

`docker-compose.yml` currently runs:
- `app` (Next.js) on port `3000`
- optional `redis` block (commented)

This setup is intended for self-hosted deployment and local integration testing.

---

## Quick Start

```bash
# 1. Prepare environment
cp .env.example .env.local

# 2. Start app container
docker compose up --build

# 3. Open app
http://localhost:3000
```

Run in detached mode:

```bash
docker compose up -d --build
```

Stop:

```bash
docker compose down
```

---

## Environment Variables

Compose reads `.env.local` via:

```yaml
env_file:
  - .env.local
```

Minimum required variables for app container:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_SITE_URL`

Optional but recommended:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `INNGEST_SIGNING_KEY`
- `INNGEST_EVENT_KEY`

---

## Healthcheck

The app container is considered healthy when:

```http
GET /api/health
```

returns 200.

Configured in compose:

```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
```

---

## Optional Local Redis

If not using Upstash locally, uncomment Redis service in `docker-compose.yml`.

Then set env values accordingly.

---

## Notes

- Current compose file is app-first. For full local stack (app + postgres + redis), add a `db` service if needed.
- Production still recommended on Vercel + Neon + Upstash for reliability.
