# Database Conventions

## Prisma

### Schema Conventions

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Always add indexes for foreign keys and frequently queried fields
  @@index([email])
  @@index([createdAt])
}
```

### Indexes — ALWAYS Add

```prisma
// For list queries with filters, ALWAYS add composite indexes
@@index([status, createdAt])
@@index([userId, createdAt])

// Foreign keys should always be indexed
@@index([assigneeId])
@@index([orderId])
```

### Never Modify Deployed Migrations

Once a migration is deployed to production, **never** edit it.
Instead, create a new migration:
```bash
npx prisma migrate dev --name meaningful_name
npx prisma migrate deploy  # production
```

### Prisma Client Usage

```typescript
// Always import singleton from lib/prisma.ts
import { prisma } from "@/lib/prisma";

// List with pagination
const [items, total] = await Promise.all([
  prisma.order.findMany({ where, take: limit, skip: offset, include }),
  prisma.order.count({ where }),
]);
return list(items, buildPagination(page, limit, total));
```

### Query Patterns

```typescript
// ✅ Good: include only what's needed
const orders = await prisma.order.findMany({
  where: { status: "pending" },
  include: { customer: { select: { name: true, email: true } } },
  orderBy: { createdAt: "desc" },
});

// ❌ Bad: include everything (N+1 risk)
const orders = await prisma.order.findMany({ include: { customer: true, items: true, ... } });
```

### Transactions

Use `prisma.$transaction` for multi-step writes:
```typescript
await prisma.$transaction([
  prisma.order.create({ data }),
  prisma.notification.create({ data }),
]);
```

## Migrations Safety

- Run `npx prisma migrate dev` in development
- Always test migrations on a backup before applying to production
- Document schema changes in `CHANGELOG.md`
- Neon (production): use `npx prisma migrate deploy` — no `migrate prod`

---

## Project-Specific Conventions

### TaskKanban
- Always index `[orderId, column]` and `[assigneeId]`
- `column` is a string: `backlog | todo | in_progress | in_review | done`
- LP is set on task creation by PM; auto-awarded on "done" transition
- Always cascade delete from Order

### ProjectMember
- FK: `memberId → TeamMember`, `projectRoleKey → ProjectRole.key`
- Unique constraint on `[projectId, memberId]`
- `projectRoleKey` values seeded: `pm | designer | dev | qa | seo`

### CustomerWebsite
- `configStatus`: `pending_config → configured → delivered → cancelled`
- eKYC fields (`ekycName`, `ekycIdNumber`, `ekycDob`, `ekycAddress`) are PII — application-level encryption recommended
- `domain` field was previously `@unique`, now nullable (multiple sites per customer allowed)

### HandoverPackage
- `figmaUrl` saved when client approves final FigmaDemo
- `scope` JSON: `{ features: string[], pointCount: number, customRequests: string[] }`
- Lookup by `projectId` (not by id)

### Shadow Database
- `prisma.config.ts` must NOT set `shadowDatabaseUrl` equal to the main URL — Prisma v7 rejects this
- If `prisma migrate dev` fails with shadow DB errors, use `prisma db push` + manual migration SQL file
