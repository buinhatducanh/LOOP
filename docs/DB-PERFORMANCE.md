# Database Performance Review

> **Updated:** 2026-03-26 | **Database:** PostgreSQL (Neon) | **ORM:** Prisma 7

---

## Current Index Coverage

### ✅ Already Indexed (Good)

| Model | Indexes | Notes |
|-------|---------|-------|
| `Order` | `status+createdAt`, `orderType+status`, `customerEmail`, `referralCodeId` | Comprehensive |
| `Role` | `level` | OK |
| `Permission` | `roleId+resource+action` (unique), `resource`, `roleId+action` | Excellent |
| `UserRole` | `userId+roleId` (unique), `userId`, `roleId` | Excellent |
| `AuditLog` | `userId`, `resource+resourceId`, `createdAt` | Good |
| `Notification` | `userId+isRead` | Good |
| `Expertise` | `category+isActive`, `isActive+sortOrder` | Good |
| `ServiceAttribute` | `tier+isActive`, `category+tier`, `parentId` | Good |
| `WebTemplate` | `level+isActive`, `category+isActive` | Good |
| `ReferralCode` | `memberId`, `campaign` | Good |
| `ReferralTracking` | `referralCodeId+event`, `referralCodeId`, `createdAt` | Excellent |
| `SalesLead` | `status+area`, `assignedTo`, `referralCodeId` | Good |
| `Quote` | `salesLeadId`, `orderId`, `status`, `infrastructureTierId` | Good |
| `FeatureGroup` | no explicit (has unique slug) | OK |
| `FeatureVariant` | no explicit (has FK index) | OK |
| `WebsiteStats` | `websiteId+date` (unique), `websiteId+date` | Good |
| `CustomerPoint` | `userEmail` (unique), `balance` | Good |
| `PointTransaction` | `customerPointId+createdAt`, `type+createdAt` | Good |
| `AdWatchHistory` | `customerPointId+watchedAt`, `advertisementId` | Good |
| `ProjectMember` | `projectId+memberId` (unique), `projectId` | Good |
| `Epic` | `projectId` | OK |
| `Backlog` | `projectId`, `epicId` | OK |
| `Task` | `backlogId`, `assigneeId`, `status` | Good |
| `BugNote` | `taskId` | OK |
| `BugNoteHistory` | `taskId` | OK |
| `Deployment` | `projectId`, `status`, `env+projectId` (unique), `projectId+environment` | Good |
| `EnvFile` | `projectId`, `envFileId` | OK |
| `EnvFileHistory` | `envFileId` | OK |
| `GitCommit` | `projectId` | OK |
| `DailyStandup` | `projectId`, `status`, `projectId+memberId+date` (unique) | Good |
| `SocialPost` | `projectId`, `status`, `endDate` | Good |
| `HandoverPackage` | `isActive` | OK |
| `Lesson` | `courseId+orderIndex` | OK |
| `Enrollment` | `courseId`, `userId` | OK |
| `StudentProgress` | `enrollmentId+lessonId` (unique), `lessonId`, `status` | Good |
| `Feedback` | `enrollmentId+lessonId` (unique), `lessonId` | Good |
| `Instructor` | `isActive` | OK |
| `LpRedemption` | `memberId`, `status` | Good |
| `LpTransaction` | `memberId`, `memberId+createdAt`, `memberId+type`, `referenceId+referenceType`, `status` | Excellent |
| `LandingSection` | `pageId+sortOrder` | Good |

---

## Missing Indexes — High Priority

These are used in list/filter queries but lack dedicated composite indexes.

### 🔴 Critical

```prisma
// ── TeamMember — List + Filter ───────────────────────────────────────
// Pattern: WHERE isActive = true ORDER BY sortOrder/name
// Missing: team_members.is_active + team_members.sort_order
// Missing: team_members.is_active + team_members.name (for filtered name search)
model TeamMember {
  @@index([isActive, sortOrder])
  @@index([isActive, name])
}

// ── Testimonial — Public List ────────────────────────────────────────
// Pattern: WHERE isActive = true ORDER BY sortOrder
model Testimonial {
  @@index([isActive, sortOrder])
}

// ── Service — Public/Admin List ──────────────────────────────────────
// Pattern: WHERE isActive = true ORDER BY sortOrder
// Pattern: WHERE category = X AND isActive = true
model Service {
  @@index([isActive, sortOrder])
  @@index([category, isActive])
}

// ── ContactMessage — Admin List ────────────────────────────────────────
// Pattern: WHERE status = X ORDER BY createdAt DESC
// Pattern: ORDER BY createdAt DESC (newest first)
model ContactMessage {
  @@index([status, createdAt])
  @@index([createdAt])
}

// ── User — Admin Search ────────────────────────────────────────────────
// Pattern: WHERE email LIKE '%x%' OR name LIKE '%x%'
// Note: Full-text search benefits from Gin indexes (see below)
model User {
  @@index([role])
  @@index([isActive])
}

// ── Project — Public/Admin List ────────────────────────────────────────
// Pattern: WHERE isPublished = true ORDER BY sortOrder
// Pattern: WHERE category = X
model Project {
  @@index([isPublished, sortOrder])
  @@index([category, isPublished])
}

// ── Task — Board Query ─────────────────────────────────────────────────
// Pattern: WHERE backlogId = X ORDER BY sortOrder
// Pattern: WHERE assigneeId = X AND status IN (...)
// Pattern: WHERE slaDeadline < now() AND slaBreached = false
model Task {
  @@index([assigneeId, status])
  @@index([slaDeadline, slaBreached])
  @@index([backlogId, sortOrder])
}

// ── GscMetric ────────────────────────────────────────────────────────
// Pattern: WHERE projectId = X ORDER BY date DESC
// Pattern: GROUP BY date for trending (date + clicks/impressions)
model GscMetric {
  @@index([projectId, date])
}

// ── ServerAnalyticsEvent ───────────────────────────────────────────────
// Pattern: WHERE event = X AND createdAt > X ORDER BY createdAt
// Heavy writes + range queries — needs careful index
model ServerAnalyticsEvent {
  @@index([event, createdAt])
}

// ── Advertisement — Active List ──────────────────────────────────────────
// Pattern: WHERE isActive = true ORDER BY sortOrder
model Advertisement {
  @@index([isActive, sortOrder])
}

// ── WebTemplate ────────────────────────────────────────────────────────
// Pattern: WHERE isActive = true AND level = X
// Pattern: WHERE category = X AND isActive = true AND highlighted = true
model WebTemplate {
  @@index([highlighted, isActive])
}

// ── ServiceAttribute ────────────────────────────────────────────────────
// Pattern: WHERE category = X AND tier = Y AND isActive = true
// Already has: [tier, isActive], [category, tier]
// Missing: category alone for "all features by category"
model ServiceAttribute {
  @@index([category, isActive])
}
```

---

## Slow Query Patterns to Monitor

### 1. Team Members + LP Aggregation (GET /api/admin/team)

```typescript
// CURRENT — N+1 risk if not careful
const [members, total] = await Promise.all([
  prisma.teamMember.findMany({ where, skip, take, include: { memberExpertise: { include: { expertise } } } }),
  prisma.teamMember.count({ where }),
]);
// Then: prisma.lpAward.groupBy({ by: ['memberId'], where: { memberId: { in: memberIds }, status: 'approved' }, _sum: { lpAmount: true } })
```

**Issue:** 3 sequential queries. For 100+ members, consider denormalizing `totalApprovedLp` onto `TeamMember` (already partially done with `availableLp`/`lockedLp`).

**Mitigation:** Add `totalApprovedLp` denormalized field on `TeamMember`, updated via Inngest on LP award approval. Query becomes 1 Prisma call.

### 2. Dashboard Stats

```typescript
// Pattern: multiple parallel COUNT/SUM queries on dashboard
// OK if parallelized with Promise.all
```

### 3. Global Search

```typescript
// Pattern: 3 parallel Prisma queries (services + team + projects)
// Each has WHERE + limit(5) — low impact
```

---

## Neon / PostgreSQL-Specific Recommendations

### 1. Enable `pg_stat_statements`

In Neon dashboard → SQL Editor:
```sql
-- Find slow queries (run after traffic):
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 2. Connection Pooling (Neon)

Neon uses serverless driver with connection pooler. Monitor pool exhaustion:
```sql
-- Check active connections:
SELECT count(*), state FROM pg_stat_activity GROUP BY state;
```

**Recommendation:** Set `connection_limit=1` in Prisma for serverless (Vercel) to prevent pool exhaustion.

### 3. Partial Indexes for Active/Inactive

For tables with many inactive records:
```sql
-- Example: only index active testimonials
CREATE INDEX idx_testimonials_active ON testimonials(sort_order)
  WHERE is_active = true;
```

### 4. JSONB Indexes

For `SocialPost.content` or `PointTransaction.description` searches:
```sql
-- Only if implementing full-text search
CREATE INDEX idx_social_posts_content_gin
  ON "social_posts" USING gin(to_tsvector('vietnamese', content));
```

---

## Prisma Query Optimization Rules

### Always specify `select` to avoid over-fetching:

```typescript
// ❌ Bad — fetches ALL fields
const users = await prisma.user.findMany({ where: { isActive: true } });

// ✅ Good — fetch only what's needed
const users = await prisma.user.findMany({
  where: { isActive: true },
  select: { id: true, name: true, email: true },
});
```

### Use `findFirst` with `skip/take` for pagination:

```typescript
// ✅ Good — explicit cursor or offset pagination
const page = await prisma.order.findMany({
  where,
  orderBy: { createdAt: "desc" },
  take: limit,
  skip: (page - 1) * limit,
});

// ❌ Bad — OFFSET on large tables (slow)
const page = await prisma.order.findMany({
  where,
  skip: 10000,
  take: 20,
});
```

### Batch reads with `Promise.all`:

```typescript
// ✅ Good — parallel queries
const [orders, total] = await Promise.all([
  prisma.order.findMany({ where, take: limit, skip, orderBy }),
  prisma.order.count({ where }),
]);

// ❌ Bad — sequential
const orders = await prisma.order.findMany(...);
const total = await prisma.order.count(...);
```

---

## Migration Safety

- **Never edit deployed migrations** — create new migrations only
- **Always test on a Neon branch** before applying to production:
  ```bash
  # Create a preview branch DB
  npx prisma migrate dev --name meaningful_name
  # Test queries with EXPLAIN ANALYZE
  npx prisma migrate deploy  # production
  ```
- **Backup before large migrations:**
  ```bash
  # Neon: create a branch from dashboard before migration
  ```
- Document all schema changes in `CHANGELOG.md`
