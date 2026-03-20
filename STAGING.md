# Staging Environment Setup

## Overview

```
develop branch  →  Vercel Preview    →  Neon staging branch DB
main branch      →  Vercel Production →  Neon production DB
```

**Staging URL:** `https://loop-website-git-develop-loop-company.vercel.app` (or custom preview URL)

---

## 1. Neon — Staging Database Branch

### Create a staging branch

1. Go to [Neon Console](https://neon.tech) → Your project
2. Click **Branches** → **Create Branch**
3. Configure:
   - **Branch name:** `staging`
   - **Parent branch:** `main`
   - **Protection:** Enable (prevents accidental writes)
   - **Compute size:** `0.25 CU` (suitable for staging)
4. Copy the connection string:
   ```
   postgresql://user:password@ep-staging-xxx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

### Staging .env variables

In **Vercel Dashboard** → Your project → **Settings** → **Environment Variables**:

| Variable | Value | Environments |
|-----------|-------|--------------|
| `DATABASE_URL` | Staging branch connection string | `Preview`, `Development` |
| `NODE_ENV` | `production` | `Preview`, `Development` |

---

## 2. Vercel — Preview Deployments

### Automatic preview per PR

Vercel automatically creates a preview deployment for every push/PR on all branches.

### Assign preview branches

1. Go to **Settings** → **Git**
2. Under **Builds and Deployments**:
   - **Production Branch:** `main` → deploys to `loop.vn`
   - **Preview Branches:** `develop, *` → creates preview deployments
3. Save

### Branch protection

Set up in **GitHub** → Repository → **Settings** → **Branches** → **Branch protection rules**:

```
Pattern: main
✓ Require pull request reviews before merging
✓ Dismiss stale reviews
✓ Require status checks to pass before merging
  → Required: CI (lint + test + build)
✓ Require branches to be up to date before merge
```

---

## 3. GitHub Actions — Preview Deployment

For enhanced control, add a workflow that sets staging env vars on preview:

```yaml
# .github/workflows/preview.yml
name: Preview Deployment

on:
  push:
    branches: [develop]

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    environment: preview
    steps:
      - uses: actions/checkout@v4
      - run: echo "DATABASE_URL=${{ secrets.STAGING_DATABASE_URL }}" >> $GITHUB_ENV
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: "--env=DATABASE_URL"
```

---

## 4. CI Pipeline

### Secrets to configure in GitHub

Add these in **GitHub** → Repository → **Settings** → **Secrets and variables** → **Actions**:

| Secret | Where to get it |
|--------|----------------|
| `DATABASE_URL` | Neon production connection string |
| `STAGING_DATABASE_URL` | Neon staging branch connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `VERCEL_TOKEN` | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | `vercel env pull --token=$VERCEL_TOKEN` |
| `VERCEL_PROJECT_ID` | `vercel env pull --token=$VERCEL_TOKEN` |

---

## 5. Sanity Studio — Staging

For Sanity CMS staging, use dataset levels:

| Dataset | Purpose | Vercel Environment |
|---------|---------|-------------------|
| `production` | Live blog content | Production |
| `staging` | Test content | Preview |

```bash
# In sanity.config.ts, use environment-based dataset:
NEXT_PUBLIC_SANITY_DATASET=${NEXT_PUBLIC_SANITY_DATASET:-production}
```

---

## 6. Deployment Flow

```
PR to develop  →  Vercel Preview + Staging DB
       ↓
Code Review (2 approvals)
       ↓
Merge to develop  →  Vercel Preview (auto-deploy)
       ↓
Test on staging  →  QA sign-off
       ↓
PR to main  →  Vercel Production + Neon main DB
       ↓
Auto-deploy to loop.vn
```

---

## 7. Local Development with Staging DB

```bash
# Connect to staging database locally
DATABASE_URL="postgresql://..." npx prisma studio

# Pull staging schema
DATABASE_URL="postgresql://..." npm run db:push

# Seed staging with production-like data
DATABASE_URL="postgresql://..." npm run db:seed
```
