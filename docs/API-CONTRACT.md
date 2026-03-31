# API Contract — Full Reference

> **Version:** 1.0 | **Updated:** 2026-03-31 (FE-BE phases F0–F8 + Fi + Fs + R-seed all complete)
> **Base URL:** `https://loopcompany.com` (production), `http://localhost:3000` (dev)

---

## Conventions

### Response Shapes

**Single item:**
```json
{ "data": { ... } }
```

**Paginated list:**
```json
{ "data": [...], "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 } }
```

**Error:**
```json
{ "error": "human-readable message", "code": "OPTIONAL_ERROR_CODE" }
```

### Pagination

All list endpoints accept query params:
- `?page=1` — page number (default: 1)
- `?limit=20` — items per page (default: 20, max: 100)

### HTTP Status Codes

| Code | When |
|------|------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Not authenticated |
| 403 | No permission |
| 404 | Not found |
| 409 | Conflict |
| 422 | Unprocessable entity |
| 429 | Rate limited |
| 500 | Server error |

### Rate Limiting

- **Public endpoints:** 100 req/min per IP
- **Admin endpoints:** 1000 req/min per user
- **Auth endpoints:** 5 req/min per IP

### Internationalization (i18n)

All public content endpoints accept a `?lang=` query param to return localized content.

Supported locales: `vi` (default), `en`, `ja`, `ko`, `zh`

```bash
# Locale on list endpoints
GET /api/v1/services?lang=en
GET /api/v1/projects?lang=ja
GET /api/v1/team?lang=ko

# Locale on detail endpoints
GET /api/services/[slug]?lang=en
GET /api/projects/[slug]?lang=zh
GET /api/team/[slug]?lang=vi

# Locale on blog
GET /api/blog-posts?lang=en
GET /api/blog-posts/[slug]?lang=en

# Locale on expertises
GET /api/expertises?lang=en
```

**Fallback behavior:**
- If `?lang=` is omitted → defaults to `vi`
- If a translated field is `null` → falls back to Vietnamese content
- If `?lang=` value is invalid → falls back to `vi`

**Response metadata:**
Localized responses include a `_localeUsed` field indicating which locale was applied:
```json
{
  "data": [...],
  "_localeUsed": "en"
}
```

---

## Authentication

### Credentials (JWT)

```bash
# Login
POST /api/admin/auth/login
Body: { "email": "admin@loop.com", "password": "..." }
Response: { "user": { ... } } + sets HttpOnly cookie
```

```bash
# Get current user
GET /api/admin/auth/me
Cookie: auth-token=<jwt>
Response: { "user": { "userId", "email", "name", "role", "roles", "avatar",
           "accountType", "teamMemberId", "roleLevel", "permissions[]" } }
```

```bash
# Logout
POST /api/admin/auth/logout
Cookie: auth-token=<jwt>
Response: { "data": { "success": true } }
```

### Google OAuth (NextAuth)

```bash
# Initiate OAuth flow
GET /api/auth/signin/google

# OAuth callback
GET /api/auth/callback/google
```

### Auth Me — Full Response Shape

```typescript
// GET /api/admin/auth/me
interface AuthMeResponse {
  user: {
    userId: string;
    email: string;
    name: string;
    role: string;          // Primary role name, e.g. "admin"
    roles: string[];      // All role names, e.g. ["admin", "member"]
    avatar: string | null;
    accountType: "staff" | "customer";
    teamMemberId: string | null;
    roleLevel: number;    // CEO=-1, super_admin=0, admin=1, pm=2, media=3, qa=4, member=5
    permissions: Array<{
      resource: string;    // e.g. "orders", "tasks"
      action: string;      // "create" | "read" | "update" | "delete" | "export" | "approve"
      scope: string;       // "all" | "own" | specific IDs
    }>;
  };
}
```

---

## Public Endpoints

### Content

#### Services
```bash
GET  /api/services         List all active services
     ?page=1&limit=20

GET  /api/services/order   Order a service (POST)
     Body: { "serviceId": "cuid", "name": "...", "email": "...", "phone": "...", "message": "..." }
     Response: { "data": { "orderId": "cuid", "status": "pending" } }
```

#### Projects
```bash
GET  /api/projects         List all projects
     ?page=1&limit=20&category=website

GET  /api/projects/[slug]   Get project by slug
     Response: { "data": Project }
```

#### Team
```bash
GET  /api/team             List all team members
     ?locale=vi&page=1&limit=20

GET  /api/v1/team/[slug]   Get team member by slug (v1 stable)
     ?lang=vi|en|ja|ko|zh
     Response: { "data": TeamMember, "meta": { "locale": string } }
```

#### Testimonials
```bash
GET  /api/testimonials     List all testimonials
     ?page=1&limit=20
     Response: { "data": Testimonial[], "pagination": {...} }
```

### Contact & Forms
```bash
POST /api/contact          Submit contact form (rate-limited)
     Body: { "name": "...", "email": "...", "phone": "...", "message": "..." }
     Response: { "data": { "id": "cuid" } } # 201

GET  /api/contact          List all contact messages (auth required — admin only)
```

### Search
```bash
GET  /api/search           Global search (rate-limited, public)
     ?q=keyword&locale=vi
     Response: { "data": { "services": [], "team": [], "projects": [], "total": 0 } }
```

### Pricing

```bash
GET  /api/pricing                     Get all pricing data
     Response: { "data": { plans: [], hosting: [], domains: [] } }

POST /api/pricing/calculate          Calculate price
     Body: { "selections": [{ "featureId": "cuid", "variantId": "cuid" }] }
     Response: { "data": { "totalPrice": 5000000, "breakdown": [] } }

POST /api/pricing/calculator          Full pricing calculator
     Body: { ... }
     Response: { "data": { ... } }

POST /api/pricing/quote               Submit quote request
     Body: { "name": "...", "email": "...", "phone": "...", "requirements": "..." }
     Response: { "data": { "success": true, "message": "..." } }

GET  /api/pricing/features            Get pricing feature comparison
GET  /api/pricing/infrastructure-tiers  Get hosting tiers

POST /api/pricing/seed                Seed pricing data (admin only — was GET, now POST)
     Auth: requireAuth + isAdmin
```

### Referral
```bash
GET  /api/ref/[code]           Handle referral link
GET  /api/ref/[code]/info      Get referral code info
```

### Analytics
```bash
POST /api/analytics/track       Track analytics event
     Body: { "event": "page_view", "data": { "page": "/", "referrer": "..." } }
```

### OG Image
```bash
GET  /api/og                   Generate OG image
     ?title=...&description=...&image=...
```

### Portal
```bash
GET  /api/portal/[token]       Customer portal access
POST /api/portal/[token]/generate  Generate portal token
```

### Public Landing & Figma
```bash
GET  /api/public/landing/[slug]   Get landing page data
GET  /api/public/figma-review/[token]  Figma review (public, token-gated)
```

### Growth Loop
```bash
GET  /api/growth-loop/[memberId]  Get growth loop data for member
```

### Dual Services
```bash
GET  /api/dual-services         List services with extra data
```

---

## v1 API Contract

```bash
GET /api/v1/route              API version info
GET /api/v1/blog                Blog posts
GET /api/v1/projects            Projects
GET /api/v1/services            Services
GET /api/v1/team                Team
GET /api/v1/testimonials        Testimonials
GET /api/v1/pricing             Pricing
```

---

## Admin API — Auth Required

### Dashboard & KPI

```bash
GET  /api/admin/dashboard              Dashboard stats
GET  /api/admin/dashboard/charts       Dashboard charts
GET  /api/admin/kpi/dashboard          KPI dashboard
GET  /api/admin/kpi/member-performance  Member performance metrics
```

### Content Management

```bash
# Services
GET    /api/admin/services              List/create services
POST   /api/admin/services
GET    /api/admin/services/[id]        Get/update/delete service
PUT    /api/admin/services/[id]
DELETE /api/admin/services/[id]

# Projects
GET    /api/admin/projects
POST   /api/admin/projects
GET    /api/admin/projects/[id]
PUT    /api/admin/projects/[id]
DELETE /api/admin/projects/[id]
GET    /api/admin/projects/[id]/members

# Team
GET    /api/admin/team
POST   /api/admin/team
GET    /api/admin/team/[id]
PUT    /api/admin/team/[id]
DELETE /api/admin/team/[id]

# Expertises
GET    /api/admin/expertises
POST   /api/admin/expertises
GET    /api/admin/expertises/[id]
PUT    /api/admin/expertises/[id]
DELETE /api/admin/expertises/[id]

# Blog Posts
GET    /api/admin/blog-posts
POST   /api/admin/blog-posts
GET    /api/admin/blog-posts/[id]
PUT    /api/admin/blog-posts/[id]
DELETE /api/admin/blog-posts/[id]
POST   /api/admin/blog-posts/[id]/publish

# Testimonials
GET    /api/admin/testimonials
POST   /api/admin/testimonials
GET    /api/admin/testimonials/[id]
PUT    /api/admin/testimonials/[id]
DELETE /api/admin/testimonials/[id]

# Contact Messages
GET    /api/admin/messages
GET    /api/admin/messages/[id]
PUT    /api/admin/messages/[id]
DELETE /api/admin/messages/[id]

# Home Sliders
GET    /api/admin/home-sliders
POST   /api/admin/home-sliders
GET    /api/admin/home-sliders/[id]
PUT    /api/admin/home-sliders/[id]
DELETE /api/admin/home-sliders/[id]
POST   /api/admin/home-sliders/reorder

# Home Video
GET    /api/admin/home-video
POST   /api/admin/home-video

# Landing Pages
GET    /api/admin/landing-pages
POST   /api/admin/landing-pages
GET    /api/admin/landing-pages/[id]
PUT    /api/admin/landing-pages/[id]
DELETE /api/admin/landing-pages/[id]
GET    /api/admin/landing-pages/[id]/sections
POST   /api/admin/landing-pages/[id]/sections
GET    /api/admin/landing-pages/[id]/sections/[sectionId]
PUT    /api/admin/landing-pages/[id]/sections/[sectionId]
DELETE /api/admin/landing-pages/[id]/sections/[sectionId]
```

### Sales & Commerce

```bash
# Orders
GET    /api/admin/orders
POST   /api/admin/orders
GET    /api/admin/orders/[id]
PUT    /api/admin/orders/[id]
DELETE /api/admin/orders/[id]
POST   /api/admin/orders/[id]/transition
       Body: { "status": "confirmed" | "processing" | "completed" | "cancelled" }
POST   /api/admin/orders/[id]/calculate-price
GET    /api/admin/orders/[id]/payments
POST   /api/admin/orders/[id]/payments

# Quotes
GET    /api/admin/quotes
POST   /api/admin/quotes
GET    /api/admin/quotes/[id]
PUT    /api/admin/quotes/[id]
DELETE /api/admin/quotes/[id]
POST   /api/admin/quotes/[id]/approve

# Quote Requests
GET    /api/admin/quote-requests
POST   /api/admin/quote-requests
GET    /api/admin/quote-requests/[id]
PUT    /api/admin/quote-requests/[id]
DELETE /api/admin/quote-requests/[id]

# Sales Leads
GET    /api/admin/sales-leads
POST   /api/admin/sales-leads
GET    /api/admin/sales-leads/[id]
PUT    /api/admin/sales-leads/[id]
DELETE /api/admin/sales-leads/[id]

# Maintenance Contracts
GET    /api/admin/maintenance-contracts
POST   /api/admin/maintenance-contracts
GET    /api/admin/maintenance-contracts/[id]
PUT    /api/admin/maintenance-contracts/[id]
DELETE /api/admin/maintenance-contracts/[id]
POST   /api/admin/maintenance-contracts/[id]/renew

# Daily Standups
GET    /api/admin/daily-standups
POST   /api/admin/daily-standups
GET    /api/admin/daily-standups/[id]
PUT    /api/admin/daily-standups/[id]
DELETE /api/admin/daily-standups/[id]

# Sales daily standups (separate namespace)
GET    /api/admin/sales/daily-standups
POST   /api/admin/sales/daily-standups
GET    /api/admin/sales/daily-standups/[id]
PUT    /api/admin/sales/daily-standups/[id]
DELETE /api/admin/sales/daily-standups/[id]
```

### Packages & Pricing

```bash
# Web Packages
GET    /api/admin/packages/web-packages
POST   /api/admin/packages/web-packages
GET    /api/admin/packages/web-packages/[id]
PUT    /api/admin/packages/web-packages/[id]
DELETE /api/admin/packages/web-packages/[id]

# Hosting Plans
GET    /api/admin/packages/hosting-plans
POST   /api/admin/packages/hosting-plans
GET    /api/admin/packages/hosting-plans/[id]
PUT    /api/admin/packages/hosting-plans/[id]
DELETE /api/admin/packages/hosting-plans/[id]

# Domain Prices
GET    /api/admin/packages/domain-prices
POST   /api/admin/packages/domain-prices
GET    /api/admin/packages/domain-prices/[id]
PUT    /api/admin/packages/domain-prices/[id]
DELETE /api/admin/packages/domain-prices/[id]

# Feature Categories (Feature Groups)
GET    /api/admin/packages/feature-categories
POST   /api/admin/packages/feature-categories
GET    /api/admin/packages/feature-categories/[id]
PUT    /api/admin/packages/feature-categories/[id]
DELETE /api/admin/packages/feature-categories/[id]

# Comparison Features
GET    /api/admin/packages/comparison-features
POST   /api/admin/packages/comparison-features
GET    /api/admin/packages/comparison-features/[id]
PUT    /api/admin/packages/comparison-features/[id]
DELETE /api/admin/packages/comparison-features/[id]

# Deployment Items
GET    /api/admin/packages/deployment-items
POST   /api/admin/packages/deployment-items
GET    /api/admin/packages/deployment-items/[id]
PUT    /api/admin/packages/deployment-items/[id]
DELETE /api/admin/packages/deployment-items/[id]

# Service Attributes
GET    /api/admin/service-attributes
POST   /api/admin/service-attributes
GET    /api/admin/service-attributes/[id]
PUT    /api/admin/service-attributes/[id]
DELETE /api/admin/service-attributes/[id]

# Addon Services
GET    /api/admin/addon-services
POST   /api/admin/addon-services
GET    /api/admin/addon-services/[id]
PUT    /api/admin/addon-services/[id]
DELETE /api/admin/addon-services/[id]

# Web Templates
GET    /api/admin/web-templates
POST   /api/admin/web-templates
GET    /api/admin/web-templates/[id]
PUT    /api/admin/web-templates/[id]
DELETE /api/admin/web-templates/[id]

# SLA Rules
GET    /api/admin/sla-rules
POST   /api/admin/sla-rules
GET    /api/admin/sla-rules/[id]
PUT    /api/admin/sla-rules/[id]
DELETE /api/admin/sla-rules/[id]

# Reward Tiers
GET    /api/admin/reward-tiers
POST   /api/admin/reward-tiers
GET    /api/admin/reward-tiers/[id]
PUT    /api/admin/reward-tiers/[id]
DELETE /api/admin/reward-tiers/[id]
GET    /api/admin/reward-tiers/[id]/items
POST   /api/admin/reward-tiers/[id]/items
GET    /api/admin/reward-tiers/[id]/items/[itemId]
PUT    /api/admin/reward-tiers/[id]/items/[itemId]
DELETE /api/admin/reward-tiers/[id]/items/[itemId]

# Referral Codes
GET    /api/admin/referral-codes
POST   /api/admin/referral-codes
GET    /api/admin/referral-codes/[id]
PUT    /api/admin/referral-codes/[id]
DELETE /api/admin/referral-codes/[id]
```

### Loyalty Points (LP)

```bash
# LP Awards
GET    /api/admin/lp-awards
POST   /api/admin/lp-awards
GET    /api/admin/lp-awards/[id]
PUT    /api/admin/lp-awards/[id]
DELETE /api/admin/lp-awards/[id]
POST   /api/admin/lp-awards/[id]/approve
POST   /api/admin/lp-awards/[id]/reject

# LP Redemptions
GET    /api/admin/lp-redemptions
POST   /api/admin/lp-redemptions

# LP Summary
GET    /api/admin/lp-summary/[projectId]

# LP Balance
GET    /api/admin/lp-transactions/[memberId]/balance

# LP Transactions
GET    /api/admin/lp-transactions
POST   /api/admin/lp-transactions

# LP Transfers
GET    /api/admin/lp-transfers
POST   /api/admin/lp-transfers
```

### Project Management (JIRA-like)

```bash
# Epics
GET    /api/admin/epics
POST   /api/admin/epics
GET    /api/admin/epics/[id]
PUT    /api/admin/epics/[id]
DELETE /api/admin/epics/[id]

# Backlogs
GET    /api/admin/backlogs
POST   /api/admin/backlogs
GET    /api/admin/backlogs/[id]
PUT    /api/admin/backlogs/[id]
DELETE /api/admin/backlogs/[id]

# Tasks
GET    /api/admin/tasks
POST   /api/admin/tasks
GET    /api/admin/tasks/[id]
PUT    /api/admin/tasks/[id]
DELETE /api/admin/tasks/[id]
POST   /api/admin/tasks/[id]/transition
POST   /api/admin/tasks/[id]/revoke
GET    /api/admin/tasks/my         # My assigned tasks

# Bug Notes
GET    /api/admin/bug-notes
POST   /api/admin/bug-notes
GET    /api/admin/bug-notes/[id]
PUT    /api/admin/bug-notes/[id]
DELETE /api/admin/bug-notes/[id]
POST   /api/admin/bug-notes/[id]/resolve

# Deployments
GET    /api/admin/deployments
POST   /api/admin/deployments
GET    /api/admin/deployments/[id]
PUT    /api/admin/deployments/[id]
DELETE /api/admin/deployments/[id]
POST   /api/admin/deployments/[id]/trigger

# Figma Demos
GET    /api/admin/figma-demos
POST   /api/admin/figma-demos
GET    /api/admin/figma-demos/[id]
PUT    /api/admin/figma-demos/[id]
DELETE /api/admin/figma-demos/[id]
POST   /api/admin/figma-demos/[id]/approve
POST   /api/admin/figma-demos/[id]/reject

# Env Files
GET    /api/admin/env-files
POST   /api/admin/env-files
GET    /api/admin/env-files/[id]
PUT    /api/admin/env-files/[id]
DELETE /api/admin/env-files/[id]
POST   /api/admin/env-files/[id]/restore

# Handover Packages
GET    /api/admin/handover-packages
POST   /api/admin/handover-packages
GET    /api/admin/handover-packages/[id]
PUT    /api/admin/handover-packages/[id]
DELETE /api/admin/handover-packages/[id]

# Git Commits
GET    /api/admin/git-commits
POST   /api/admin/git-commits

# Social Posts
GET    /api/admin/social-posts
POST   /api/admin/social-posts
GET    /api/admin/social-posts/[id]
PUT    /api/admin/social-posts/[id]
DELETE /api/admin/social-posts/[id]
POST   /api/admin/social-posts/[id]/publish

# GSC Metrics
GET    /api/admin/gsc
POST   /api/admin/gsc

# Daily Standups
GET    /api/admin/daily-standups
POST   /api/admin/daily-standups
GET    /api/admin/daily-standups/[id]
PUT    /api/admin/daily-standups/[id]
DELETE /api/admin/daily-standups/[id]

# Task Violations
GET    /api/admin/task-violations
POST   /api/admin/task-violations
```

### System

```bash
# Users
GET    /api/admin/users
POST   /api/admin/users
GET    /api/admin/users/[id]
PUT    /api/admin/users/[id]
DELETE /api/admin/users/[id]

# Roles
GET    /api/admin/roles
POST   /api/admin/roles

# Audit Log
GET    /api/admin/audit-log
POST   /api/admin/audit-log

# Settings
GET    /api/admin/settings
POST   /api/admin/settings

# Customer Websites
GET    /api/admin/customer-websites
POST   /api/admin/customer-websites
GET    /api/admin/customer-websites/[id]
PUT    /api/admin/customer-websites/[id]
DELETE /api/admin/customer-websites/[id]

# Customer Points
GET    /api/admin/customer-points
POST   /api/admin/customer-points
GET    /api/admin/customer-points/[pointId]
PUT    /api/admin/customer-points/[pointId]
DELETE /api/admin/customer-points/[pointId]

# Points
GET    /api/admin/points
POST   /api/admin/points
GET    /api/admin/points/activities
POST   /api/admin/points/activities
GET    /api/admin/points/ads
POST   /api/admin/points/ads

# Rank
GET    /api/admin/rank/leaderboard
GET    /api/admin/rank/sync/[memberId]

# Upload
POST   /api/admin/upload
       Body: FormData with "file" field
       Response: { "data": { "url": "https://res.cloudinary.com/...", "publicId": "..." } }
```

### Education (EDU)

```bash
# Courses
GET    /api/admin/edu/courses
POST   /api/admin/edu/courses
GET    /api/admin/edu/courses/[id]
PUT    /api/admin/edu/courses/[id]
DELETE /api/admin/edu/courses/[id]
GET    /api/admin/edu/courses/[id]/lessons
POST   /api/admin/edu/courses/[id]/lessons

# Instructors
GET    /api/admin/edu/instructors
POST   /api/admin/edu/instructors
GET    /api/admin/edu/instructors/[id]
PUT    /api/admin/edu/instructors/[id]
DELETE /api/admin/edu/instructors/[id]

# Enrollments
GET    /api/admin/edu/enrollments
POST   /api/admin/edu/enrollments
GET    /api/admin/edu/enrollments/[id]
PUT    /api/admin/edu/enrollments/[id]
DELETE /api/admin/edu/enrollments/[id]
POST   /api/admin/edu/enrollments/[id]/payment

# Attendance
GET    /api/admin/edu/attendance
POST   /api/admin/edu/attendance

# Feedback
GET    /api/admin/edu/feedback
POST   /api/admin/edu/feedback
```

### Webhooks

```bash
POST /api/webhooks/github/[projectId]      GitHub webhook (signature-verified)
POST /api/webhooks/vercel/[projectId]       Vercel webhook (signature-verified)
```

### Background Jobs

```bash
POST /api/inngest         Inngest event receiver
```

---

## Key Entity Shapes

### Service
```typescript
{
  id: string;
  slug: string;
  icon: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  features: string[];
  technologies: string[];
  startingPrice: number;    // VND
  deliveryTime: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
}
```

### Order
```typescript
{
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: "pending" | "confirmed" | "processing" | "completed" | "cancelled";
  totalPrice: number;      // VND
  serviceId: string;
  createdAt: string;       // ISO date
  updatedAt: string;
}
```

### Task (JIRA-like)
```typescript
{
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "in_review" | "done";
  priority: "low" | "medium" | "high" | "critical";
  assigneeId: string;
  epicId: string | null;
  backlogId: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  slaBreached: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### TeamMember
```typescript
{
  id: string;
  slug: string;
  name: string;
  role: string;           // Job title
  bio: string;
  avatar: string;
  rank: string;           // e.g. "founder", "senior", "junior"
  xp: number;             // Experience points
  lp: number;             // Loyalty points
  level: number;
  skills: string[];
  socialLinks: { platform: string; url: string }[];
  isActive: boolean;
}
```

---

## Frontend Integration Guide

### Initial Setup

```typescript
// 1. Authenticate
const loginRes = await fetch('/api/admin/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
  credentials: 'include', // important: include cookies
});
const { user } = await loginRes.json();

// 2. Store auth state
// user.permissions → check for access
// user.roleLevel → check for role hierarchy

// 3. Fetch data
const res = await fetch('/api/admin/services', {
  credentials: 'include', // send JWT cookie
});
const { data, pagination } = await res.json();
```

### Permission Check Example

```typescript
// Check if user can delete orders
const canDelete = user.permissions?.some(
  p => p.resource === 'orders' && p.action === 'delete'
);
```

### Error Handling

```typescript
const res = await fetch('/api/admin/orders', { credentials: 'include' });
if (!res.ok) {
  const { error, code } = await res.json();
  if (res.status === 401) redirect('/login');
  if (res.status === 403) showPermissionError();
  showToast(error);
}
```
