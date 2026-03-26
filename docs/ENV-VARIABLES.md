# Environment Variables

> **Source:** `.env.example` | **Updated:** 2026-03-26

---

## Required Variables

> Without these, the app **will not start**.

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@ep-xxx/neondb?sslmode=require` |
| `AUTH_SECRET` | NextAuth session signing secret (min 32 chars) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Canonical site URL | `https://loop.vn` |

---

## Optional — Core Functionality

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SITE_URL` | Public site URL (sitemap, OG images, canonical) | `NEXTAUTH_URL` |
| `NEXT_PUBLIC_MOCK_API` | Enable mock API routes (`/api/mock/*`) for FE dev without backend | `false` |

---

## Google OAuth

| Variable | Description | Where to get |
|----------|-------------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret | Same as above |

**Setup:** Create OAuth 2.0 Client ID (Web application type). Add authorized redirect:
```
{NEXTAUTH_URL}/api/auth/callback/google
```

---

## Sanity CMS

| Variable | Description | Where to get |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID | [sanity.io/manage](https://sanity.io/manage) → Your Project → API |
| `NEXT_PUBLIC_SANITY_DATASET` | Dataset name | Usually `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | API version date | `2024-01-01` |

---

## Cloudinary (File Upload)

| Variable | Description | Where to get |
|----------|-------------|-------------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloud name | [cloudinary.com](https://cloudinary.com) → Dashboard |
| `CLOUDINARY_API_KEY` | API Key | Dashboard → API Keys |
| `CLOUDINARY_API_SECRET` | API Secret | Dashboard → API Keys |

**Usage:** Images uploaded via `POST /api/admin/upload` → served from Cloudinary CDN.

---

## Analytics & SEO

| Variable | Description | Where to get |
|----------|-------------|-------------|
| `NEXT_PUBLIC_GA_ID` | GA4 Measurement ID | [analytics.google.com](https://analytics.google.com) → Admin → Data Streams |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Same as GA_ID (legacy) | Same as above |
| `NEXT_PUBLIC_GSC_VERIFICATION` | Google Search Console meta tag | GSC → Settings → Users & Permissions |

---

## Live Chat

| Variable | Description | Where to get |
|----------|-------------|-------------|
| `NEXT_PUBLIC_TAWKTO_PROPERTY_ID` | tawk.to property ID | [tawk.to](https://www.tawk.to) → Dashboard → Widget |
| `NEXT_PUBLIC_TAWKTO_WIDGET_ID` | Widget ID | Same as above |

---

## Optional — Enhanced Features

| Variable | Description | Status |
|----------|-------------|--------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL | Enables distributed rate limiting + caching |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token | Same as above |
| `INNGEST_SIGNING_KEY` | Inngest signing key | Enables background jobs |
| `INNGEST_EVENT_KEY` | Inngest event key | Same as above |
| `SENTRY_DSN` | Sentry DSN URL | Error tracking + performance |
| `RESEND_API_KEY` | Resend API key | Transactional emails |
| `GITHUB_WEBHOOK_SECRET` | GitHub webhook secret | GitHub integration |

---

## Upstash Redis (Rate Limiting)

Get from [console.upstash.com](https://console.upstash.com) → Your Database → REST API.

```bash
UPSTASH_REDIS_REST_URL="https://your-db.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_token"
```

**Without Redis:** App falls back to in-memory rate limiting. Works for single-instance deployments. **Does NOT work** on Vercel serverless (multiple instances = inconsistent rate limit state).

---

## Inngest (Background Jobs)

Get from [inngest.com](https://www.inngest.com) → Dashboard → API Keys.

```bash
INNGEST_SIGNING_KEY="sig_your_signing_key"
INNGEST_EVENT_KEY="your_event_key"
```

**Used for:**
- Sending transactional emails (Resend)
- Processing async tasks
- Scheduled jobs (daily reports, etc.)

---

## Webhooks

| Variable | Used by | Description |
|----------|---------|-------------|
| `GITHUB_WEBHOOK_SECRET` | `POST /api/webhooks/github/[projectId]` | HMAC signature verification for GitHub push events |

---

## Frontend-Only Variables (prefix `NEXT_PUBLIC_`)

These are exposed to the browser. **Never** put secrets here.

| Variable | Client-accessible? |
|----------|-------------------|
| `NEXT_PUBLIC_SITE_URL` | ✅ Yes |
| `NEXT_PUBLIC_SANITY_*` | ✅ Yes |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ✅ Yes |
| `NEXT_PUBLIC_GA_*` | ✅ Yes |
| `NEXT_PUBLIC_TAWKTO_*` | ✅ Yes |
| `NEXT_PUBLIC_MOCK_API` | ✅ Yes |

All other variables (API keys, secrets, database URL) are **server-side only**.

---

## .env File Priority

Next.js loads env files in this order (later overrides earlier):

```
.env                # committed, defaults for all environments
.env.local          # local overrides, gitignored
.env.[development]  # dev-only overrides (for team members)
.env.[production]   # production overrides
```

**Always:** Copy `.env.example` → `.env.local` → fill in real values.
