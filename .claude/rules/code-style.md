# Code Style

## TypeScript

- **Strict mode always** — no `any`, no implicit any
- Use explicit types for function parameters and return values
- Use `interface` for object shapes, `type` for unions/aliases
- Prefer `unknown` over `any` for caught errors

```typescript
// ✅ Good
async function getUser(id: string): Promise<User | null> { ... }

// ❌ Bad
async function getUser(id: any) { ... }
```

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | kebab-case | `admin-crud-list.tsx` |
| Components | PascalCase | `AdminCrudList.tsx` |
| Hooks | camelCase, prefix `use` | `useAuth.ts` |
| Utils | camelCase | `formatDate.ts` |
| Types/Interfaces | PascalCase | `UserPermission` |
| Enums | PascalCase | `OrderStatus` |
| Constants | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |
| Database columns | snake_case | `created_at` (Prisma auto) |

## Imports

```typescript
// Order: 1. built-ins → 2. packages → 3. local (@/)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/api";
```

## Async/Await

- Always use `async/await`, never `.then()` chains (except parallel `Promise.all`)
- Use `Promise.all()` for parallel independent operations
- Always `try/catch` in async functions

```typescript
// ✅ Good
const [user, orders] = await Promise.all([
  prisma.user.findUnique({ where: { id } }),
  prisma.order.findMany({ where: { userId: id } }),
]);

// ❌ Bad
prisma.user.findUnique({ where: { id } }).then(user => {
  prisma.order.findMany({ where: { userId: id } }).then(orders => { ... });
});
```

## Null Handling

- Use `??` for null coalescing
- Use `?.` for optional chaining
- Return `null` instead of `undefined` from functions that may return "nothing"

## Error Handling

```typescript
// ✅ Good
try {
  const result = await riskyOperation();
  return ok(result);
} catch (err) {
  return handleError(err);
}

// ❌ Bad
try { ... } catch { ... } // always catch with type
```

## Component Patterns

- Server Components by default; add `"use client"` only when needed
- Extract reusable logic into custom hooks
- Keep components small and focused (< 200 lines preferred)
- Use `use client` + `'use client'` directive for interactivity

## CSS / Tailwind

- Prefer Tailwind utility classes over custom CSS
- Use CSS variables via Tailwind v4 `theme()` for design tokens
- No inline styles except dynamic values
- Use `cn()` from `@/lib/utils` for conditional class merging

## Comments

- Vietnamese for complex logic explanation
- English for TODO/FIXME markers
- No commented-out code (delete, use git history)
