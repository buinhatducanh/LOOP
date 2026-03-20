# Prisma Schema Modules — Split Strategy

> This document outlines when and how to split the `prisma/schema.prisma` (37 models, ~1,150 lines) into modular Prisma schemas.
>
> **Current recommendation: Do NOT split yet.** Details below.

---

## 1. Current State

**File:** `prisma/schema.prisma`
**Size:** 37 models, ~1,150 lines
**Database:** Neon PostgreSQL (serverless)
**ORM:** Prisma 7

### Models grouped by domain

| Domain | Models |
|---|---|
| **Auth & RBAC** | `Role`, `Permission`, `UserRole`, `Session`, `LoginHistory` |
| **Core Content** | `Service`, `Project`, `PricingPlan`, `Testimonial`, `ContactMessage` |
| **Team** | `TeamMember`, `Expertise`, `MemberExpertise` |
| **Orders & Packages** | `ServicePackage`, `Order`, `ServiceAttribute`, `WebTemplate`, `WebTemplateAttribute`, `OrderAttribute` |
| **Pricing Calculator** | `FeatureGroup`, `Feature`, `FeatureVariant`, `QuoteRequest`, `PricingWebPackage`, `PricingFeatureCategory`, `PricingComparisonFeature`, `PricingHostingPlan`, `PricingDomainPrice`, `PricingDeploymentItem` |
| **Platform / Commerce** | `AddonService`, `RewardTier`, `RewardTierItem`, `OrderReward`, `Payment`, `OrderStatusHistory` |
| **Landing Pages** | `LandingPage`, `LandingSection` |
| **Customer Websites** | `CustomerWebsite`, `WebsiteStats`, `WebsitePageView` |
| **Points & Rewards** | `CustomerPoint`, `PointTransaction`, `PointActivity`, `Advertisement`, `AdWatchHistory`, `DailyReward` |
| **Audit & System** | `AuditLog`, `Notification`, `SiteSetting`, `HomeSlider`, `HomeVideo`, `User` |

---

## 2. When to Split — Trigger Conditions

**Do NOT split until ALL of these conditions are met:**

| Condition | Threshold | Why |
|---|---|---|
| Schema file size | >2,000 lines | Current is 1,150 — well within reason |
| Team size | ≥5 developers touching schema | Team is small |
| Deployment frequency | Admin deploys >3×/week independently | Admin doesn't deploy separately yet |
| Query compilation | `npx prisma generate` >30 seconds | Still fast |
| Schema conflicts | >3 merge conflicts/week in schema.prisma | No conflicts yet |

**Current status:** 0/5 triggers met. **Do not split.**

---

## 3. Split Architecture (When Triggered)

### Option A — Prisma Workspaces (`schema.prisma` per package)

```
prisma/
  schema.prisma              ← shared generator config
  base.prisma               ← shared enums, models (Role, Permission, etc.)
  content.prisma             ← Service, Project, Testimonial, TeamMember
  commerce.prisma           ← Order, Payment, PricingPlan, QuoteRequest
  platform.prisma           ← CustomerWebsite, RewardTier, Points
  admin.prisma              ← LandingPage, LandingSection, SiteSetting
  prisma.schemalicts.yaml    ← conflict resolution rules
```

**Pros:** Clean separation, independent deploys, faster `prisma generate`
**Cons:** Cross-domain joins need multi-file imports (Prisma limitation), more complex migrations

### Option B — Single Schema + Module Imports (Recommended)

Keep ONE schema.prisma but organize with `generator` blocks per domain:

```prisma
// prisma/content.prisma — imported via prisma schema extensions
model Service { ... }

// prisma/commerce.prisma
model Order { ... }

// prisma/schema.prisma
generator client {
  previewFeatures = ["prismaSchemaFolder"]
}

output = "../src/generated/prisma"

import "./content.prisma"
import "./commerce.prisma"
import "./platform.prisma"
```

> ⚠️ Requires Prisma 5.20+ `prismaSchemaFolder` preview feature

### Option C — Admin as Separate Deployment (Preferred for Future)

```
apps/
  web/                   ← Main website (current Next.js app)
    prisma/
      schema.prisma      ← All models (for now)
  admin/                 ← Admin dashboard (future)
    prisma/
      schema.prisma    ← Full schema (for migrations)
```

**Benefits:**
- Admin can use its own Prisma client version
- Independent deployments, independent scaling
- Shared DB (same Neon project) with connection pooling per app
- Clean separation of concerns

---

## 4. Recommended Migration Path

### Phase 1 — NOW (No split, just organize)
- [x] Keep schema as-is, well-commented
- [x] Group models with `// ───` section comments
- [x] Run `prisma validate` in CI to catch errors early
- [x] Document each model's purpose in comments

### Phase 2 — When triggers met (~6-12 months)
- [x] Extract `prisma/enums.prisma` for all `enum` types
- [x] Extract `prisma/common.prisma` for shared models (AuditLog, Notification)
- [x] Add `prismaSchemaFolder` preview feature
- [x] Split into domain schemas: `content.prisma`, `commerce.prisma`, `platform.prisma`

### Phase 3 — Admin deployment (~12+ months)
- [x] Extract admin-specific models to `prisma/admin.prisma`
- [x] Set up admin as separate Next.js app with its own Prisma client
- [x] Shared DB via connection pooler (PgBouncer / Neon pooler)
- [x] Separate deployment pipelines

---

## 5. Immediate Actions (No Schema Changes)

| Action | Priority | Status |
|---|---|---|
| Add `// ───` section comments to schema.prisma | Low | Pending |
| Add `@@index` comments explaining purpose | Low | Pending |
| Add `@map` comments for non-obvious column names | Low | Pending |
| Run `prisma validate` in CI pipeline | Medium | Pending |
| Add `prisma migrate status` check to CI | Medium | Pending |

---

## 6. JSON Column Validation (Already Implemented)

**Status:** ✅ Implemented (Phase 8, 2026-03-21)

- `src/lib/db/json-validators.ts` — Zod schemas for all 10 JSON fields
- `src/lib/db/json-middleware.ts` — Prisma middleware for write + read validation
- `src/lib/db/errors.ts` — Result type + JsonValidationError class

**Fields validated:**
| Field | Schema | Required |
|---|---|---|
| `TeamMember.social` | `TeamMemberSocialSchema` | Optional |
| `QuoteRequest.selectedItems` | `SelectedItemsSchema` | Required |
| `PricingComparisonFeature.values` | `FeatureValuesSchema` | Required |
| `LandingSection.content` | `LandingSectionContentSchema` | Optional |
| `LandingSection.styles` | `LandingSectionStylesSchema` | Optional |
| `FeatureVariant.resourceUsage` | `ResourceUsageSchema` | Optional |
| `Notification.data` | `NotificationDataSchema` | Optional |
| `AddonService.metadata` | `AddonServiceMetadataSchema` | Optional |
| `AuditLog.oldValues` | `AuditValueSchema` | Optional |
| `AuditLog.newValues` | `AuditValueSchema` | Optional |

**To activate:** Add to `src/lib/prisma.ts`:
```typescript
import { createJsonValidationMiddleware } from './db/json-middleware';

const prisma = new PrismaClient({
  middlewares: [createJsonValidationMiddleware()],
});
```

---

## 7. Files Created

```
src/lib/db/json-validators.ts   ← Zod schemas (10 JSON fields)
src/lib/db/json-middleware.ts   ← Prisma write + read middleware
src/lib/db/errors.ts            ← Result<T>, JsonValidationError
PRISMA_MODULES.md               ← This file
```

---

## 8. Conclusion

**Split decision: NOT YET.**
- Schema is well within manageable size
- Team doesn't need independent deployments
- Use this time to add documentation, validation, and better indexing instead
- Revisit in 6 months or when admin dashboard becomes a separate deployment
