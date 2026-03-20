# LOOP - MVP 2: Vercel Production Deployment Plan

> **Trạng thái:** MVP 1 hoàn thành (Phase 1–5). MVP 2 tập trung deploy production lên Vercel.
> **Tech Stack:** Next.js 15 (App Router) + Prisma 7 + Neon PostgreSQL + Sanity CMS + Cloudinary + TailwindCSS 4 + next-intl (vi/en) + NextAuth v5
> **Target:** Deploy production tại `https://loop-eight-delta.vercel.app` (sau đó custom domain `loop.vn`)

---

## I. TỔNG KẾT MVP 1 (ĐÃ HOÀN THÀNH)

Tất cả Phase 1–5 đã hoàn thành, bao gồm:
- Performance (ISR, next/font, React cache, dynamic imports)
- Architecture (service layer, edge utils, error boundaries)
- Scalability (Redis/Upstash, rate limiting, Inngest jobs, Docker, API v1)
- Database (soft delete, 50 indexes, JSON validation, Prisma middleware)
- Backup & DR (backup scripts, cron, rollback, staging guide)
- SEO/GEO (17 JSON-LD schemas, dynamic OG, RSS i18n, glossary, content strategy)
- Testing (70 unit tests, CI/CD pipeline)

---

## II. MVP 2 — VERCEL DEPLOYMENT CHECKLIST

### 2.1 Config Fixes (Cần sửa code)

| # | Task | Mức độ | Chi tiết | Trạng thái |
|---|------|--------|----------|------------|
| 1 | **Bỏ `output: "standalone"` trong `next.config.ts`** | 🔴 Critical | `standalone` dành cho Docker self-hosted. Vercel tự handle bundling, để `standalone` sẽ gây conflict với Vercel's build system | ⬜ Chưa làm |
| 2 | **Fix `NEXT_PUBLIC_SANITY_DATASET`** | 🔴 Critical | Hiện tại = `"s2tnlf7b"` (trùng project ID). Phải là `"production"` hoặc dataset name thật trên Sanity | ⬜ Chưa làm |
| 3 | **Prisma: chuyển sang `@neondatabase/serverless` adapter** | 🟡 Medium | Hiện dùng `pg` Pool (`@prisma/adapter-pg`) — hoạt động nhưng chưa tối ưu cho Vercel serverless. Nên dùng `@prisma/adapter-neon` + `@neondatabase/serverless` để hỗ trợ Edge Runtime & connection pooling tốt hơn | ⬜ Chưa làm |
| 4 | **Đảm bảo `postinstall` script chạy `prisma generate`** | 🟢 Done | Đã có `"postinstall": "prisma generate"` trong `package.json` | ✅ Đã có |

### 2.2 Environment Variables (Cấu hình trên Vercel Dashboard)

> **Vào Vercel Dashboard → Project Settings → Environment Variables**
> Set cho environments: **Production**, **Preview**, **Development**

| # | Variable | Giá trị | Env | Trạng thái |
|---|----------|---------|-----|------------|
| 1 | `DATABASE_URL` | `postgresql://neondb_owner:...@ep-green-forest-a4mmwl8d-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require` | Prod + Preview | ⬜ |
| 2 | `AUTH_SECRET` | Generate mới: `openssl rand -base64 32` (⚠️ ROTATE — đã bị lộ) | Prod + Preview | ⬜ |
| 3 | `NEXTAUTH_URL` | `https://loop-eight-delta.vercel.app` (sau đó đổi sang custom domain) | Prod | ⬜ |
| 4 | `NEXT_PUBLIC_SITE_URL` | `https://loop-eight-delta.vercel.app` | Prod + Preview | ⬜ |
| 5 | `NEXT_PUBLIC_SANITY_PROJECT_ID` | `s2tnlf7b` | All | ⬜ |
| 6 | `NEXT_PUBLIC_SANITY_DATASET` | `production` (⚠️ FIX — hiện sai = `s2tnlf7b`) | All | ⬜ |
| 7 | `NEXT_PUBLIC_SANITY_API_VERSION` | `2024-03-08` | All | ⬜ |
| 8 | `GOOGLE_CLIENT_ID` | `118593594611-...apps.googleusercontent.com` (⚠️ cập nhật redirect URI trên Google Console cho domain Vercel) | Prod | ⬜ |
| 9 | `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` (⚠️ ROTATE — đã bị lộ) | Prod | ⬜ |
| 10 | `NEXT_PUBLIC_GA_ID` | `G-2RQS7SRGBZ` | Prod | ⬜ |
| 11 | `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-2RQS7SRGBZ` | Prod | ⬜ |
| 12 | `NEXT_PUBLIC_GSC_VERIFICATION` | `mHqrzglKeulqCaYJHGNfyD-...` | Prod | ⬜ |
| 13 | `NEXT_PUBLIC_TAWKTO_PROPERTY_ID` | `69b41637063f791c37e4d891` | Prod | ⬜ |
| 14 | `NEXT_PUBLIC_TAWKTO_WIDGET_ID` | `1jjjndita` | Prod | ⬜ |
| 15 | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `dhlmvawmi` | All | ⬜ |
| 16 | `CLOUDINARY_API_KEY` | `435132722437445` | Prod | ⬜ |
| 17 | `CLOUDINARY_API_SECRET` | (⚠️ ROTATE — đã bị lộ) | Prod | ⬜ |
| 18 | `UPSTASH_REDIS_REST_URL` | `https://happy-mosquito-79034.upstash.io` | Prod + Preview | ⬜ |
| 19 | `UPSTASH_REDIS_REST_TOKEN` | (⚠️ ROTATE — đã bị lộ) | Prod + Preview | ⬜ |
| 20 | `INNGEST_EVENT_KEY` | (⚠️ ROTATE — đã bị lộ) | Prod | ⬜ |
| 21 | `INNGEST_SIGNING_KEY` | (⚠️ ROTATE — đã bị lộ) | Prod | ⬜ |
| 22 | `SENTRY_DSN` | `https://8e80e3d32db9...@...sentry.io/...` | Prod + Preview | ⬜ |
| 23 | `RESEND_API_KEY` | (⚠️ ROTATE — đã bị lộ) | Prod | ⬜ |

### 2.3 Credential Rotation (⚠️ BẮT BUỘC — secrets đã bị lộ trong chat)

| # | Credential | Nơi rotate | Trạng thái |
|---|-----------|-----------|------------|
| 1 | `AUTH_SECRET` | `openssl rand -base64 32` → cập nhật Vercel + .env.local | ⬜ |
| 2 | `GOOGLE_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials → Tạo secret mới | ⬜ |
| 3 | `CLOUDINARY_API_SECRET` | Cloudinary Console → Settings → API Keys → Regenerate | ⬜ |
| 4 | `UPSTASH_REDIS_REST_TOKEN` | Upstash Console → Database → REST API → Reset Token | ⬜ |
| 5 | `INNGEST_EVENT_KEY` | Inngest Dashboard → Settings → API Keys → Regenerate | ⬜ |
| 6 | `INNGEST_SIGNING_KEY` | Inngest Dashboard → Settings → API Keys → Regenerate | ⬜ |
| 7 | `RESEND_API_KEY` | Resend.com → API Keys → Revoke + Create new | ⬜ |
| 8 | `DATABASE_URL` (password) | Neon Console → Connection Details → Reset password | ⬜ |

### 2.4 Google OAuth — Cập nhật Redirect URI

> Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID

| # | Redirect URI | Trạng thái |
|---|-------------|------------|
| 1 | `https://loop-eight-delta.vercel.app/api/auth/callback/google` | ⬜ Thêm mới |
| 2 | `http://localhost:3000/api/auth/callback/google` | ✅ Đã có (dev) |
| 3 | `https://loop.vn/api/auth/callback/google` | ⬜ Thêm khi có custom domain |

### 2.5 Vercel Project Setup

| # | Task | Chi tiết | Trạng thái |
|---|------|----------|------------|
| 1 | **Import repo vào Vercel** | Vercel Dashboard → New Project → Import Git Repository | ⬜ |
| 2 | **Framework preset: Next.js** | Auto-detect, không cần config thêm | ⬜ |
| 3 | **Node.js version: 20** | Settings → General → Node.js Version = 20.x | ⬜ |
| 4 | **Build command** | `npm run build` (default) | ⬜ |
| 5 | **Root directory** | `.` (default) | ⬜ |
| 6 | **Set all env vars** | Xem mục 2.2 ở trên | ⬜ |
| 7 | **Deploy & verify** | Trigger deploy, kiểm tra build logs | ⬜ |

### 2.6 Post-Deploy Verification

| # | Check | URL / Command | Trạng thái |
|---|-------|--------------|------------|
| 1 | **Homepage loads** | `https://loop-eight-delta.vercel.app` | ⬜ |
| 2 | **Blog loads (Sanity)** | `/blog` + `/blog/[slug]` | ⬜ |
| 3 | **Auth flow (Google OAuth)** | Login → callback → session | ⬜ |
| 4 | **Contact form** | Submit → DB + rate limiting works | ⬜ |
| 5 | **Health check** | `/api/health` → DB + Sanity OK | ⬜ |
| 6 | **API v1** | `/api/v1/services` → JSON response | ⬜ |
| 7 | **i18n routing** | `/vi` + `/en` switching | ⬜ |
| 8 | **Images (Cloudinary)** | Portfolio/team images load | ⬜ |
| 9 | **Analytics** | GA + Vercel Analytics firing | ⬜ |
| 10 | **Tawk.to chat** | Widget appears | ⬜ |
| 11 | **Sitemap** | `/sitemap.xml` → valid XML | ⬜ |
| 12 | **RSS** | `/vi/feed.xml` + `/en/feed.xml` | ⬜ |
| 13 | **OG images** | `/api/og?title=Test` | ⬜ |
| 14 | **Sentry** | Trigger error → appears in Sentry dashboard | ⬜ |
| 15 | **Lighthouse score** | Target: Performance 90+, SEO 95+ | ⬜ |

### 2.7 Custom Domain (Sau khi verify OK)

| # | Task | Chi tiết | Trạng thái |
|---|------|----------|------------|
| 1 | **Thêm domain `loop.vn`** | Vercel → Settings → Domains → Add | ⬜ |
| 2 | **DNS records** | Trỏ A/CNAME theo hướng dẫn Vercel | ⬜ |
| 3 | **SSL certificate** | Vercel tự cấp (Let's Encrypt) | ⬜ |
| 4 | **Update `NEXTAUTH_URL`** | Đổi sang `https://loop.vn` | ⬜ |
| 5 | **Update `NEXT_PUBLIC_SITE_URL`** | Đổi sang `https://loop.vn` | ⬜ |
| 6 | **Update Google OAuth redirect URI** | Thêm `https://loop.vn/api/auth/callback/google` | ⬜ |
| 7 | **Update GA property** | Thêm domain `loop.vn` vào GA4 Data Stream | ⬜ |
| 8 | **Verify Google Search Console** | Thêm property `loop.vn` + submit sitemap | ⬜ |

---

## III. VẤN ĐỀ CÒN TỒN ĐỌNG TỪ MVP 1

| # | Vấn đề | Mức độ | Ghi chú |
|---|--------|--------|---------|
| 1 | **Meta description dynamic** | 🟡 Medium | Chưa implement cho tất cả pages |
| 2 | **JSON columns validation** | 🟡 Medium | Có Zod schemas nhưng middleware chưa kích hoạt production |
| 3 | **Prisma schema modules** | 🟢 Low | Chưa cần tách ở scale hiện tại (xem `PRISMA_MODULES.md`) |
| 4 | **Test coverage ~15%** | 🟡 Medium | 70 tests, target >70% |
| 5 | **Multi-tenant** | 🟢 Low | Chưa cần ở scale hiện tại |

---

## IV. PRIORITY ORDER (Thứ tự thực hiện)

### Step 1: Code fixes (trước khi deploy)
1. ⬜ Bỏ `output: "standalone"` trong `next.config.ts`
2. ⬜ Fix `NEXT_PUBLIC_SANITY_DATASET` trong `.env.local` (nếu dùng local)
3. ⬜ (Optional) Chuyển Prisma adapter sang `@neondatabase/serverless`

### Step 2: Vercel Setup
4. ⬜ Import repo → Vercel
5. ⬜ Cấu hình tất cả env vars (23 vars)
6. ⬜ Set Node.js 20

### Step 3: Credential Rotation
7. ⬜ Rotate tất cả 8 secrets đã bị lộ
8. ⬜ Cập nhật secrets mới vào Vercel + .env.local

### Step 4: Google OAuth
9. ⬜ Thêm Vercel URL vào Authorized redirect URIs

### Step 5: Deploy & Verify
10. ⬜ Trigger first deploy
11. ⬜ Chạy 15 post-deploy checks
12. ⬜ Lighthouse audit

### Step 6: Custom Domain (khi sẵn sàng)
13. ⬜ Setup `loop.vn` domain + DNS
14. ⬜ Cập nhật tất cả URLs liên quan

---

*Plan created: 2026-03-20*
*Updated: 2026-03-20 (MVP 2 — Vercel Deployment)*
*Project: LOOP - Web Development Agency Platform*
