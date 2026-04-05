# API Conventions

## Response Shape

**Standard success:**
```typescript
// Single item
{ data: T }

// List with pagination
{ data: T[], pagination: { page: number, limit: number, total: number, totalPages: number } }

// Custom
{ data: T, extra: U }
```

**Standard error:**
```typescript
{ error: string, code?: string }
```

## Response Helpers (MANDATORY)

Use only helpers from `@/lib/api` — **never** return raw `NextResponse.json()` directly:

```typescript
import { ok, list, badRequest, notFound, serverError, handleError } from "@/lib/api";

// GET single item
return ok(item);

// GET list
return list(items, buildPagination(page, limit, total));

// POST/PUT success
return ok(item, 201);

// Error in catch block
} catch (err) {
  return handleError(err);
}
```

## HTTP Status Codes

| Code | When |
|------|------|
| 200 | Success (default) |
| 201 | Created |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | No permission |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 422 | Semantically invalid |
| 429 | Rate limited |
| 500 | Server error |

## Endpoint Naming

- List: `GET /api/admin/{resource}` → returns paginated list
- Get one: `GET /api/admin/{resource}/[id]` → returns single item
- Create: `POST /api/admin/{resource}` → returns created item (201)
- Update: `PUT /api/admin/{resource}/[id]` → returns updated item
- Delete: `DELETE /api/admin/{resource}/[id]` → returns deleted item (200) or 204

## Pagination

Always accept query params: `?page=1&limit=20`
Always return `pagination` object in list responses.

## No JSX/React in API Routes

API route handlers must NOT import from `@/components/` or return JSX. Pure TypeScript only.

## Auth Guard Pattern

```typescript
import { requirePermission } from "@/lib/auth/permissions";
import { handleError, ok } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const session = await requirePermission("orders", "read");
    // ... logic
    return ok(data);
  } catch (err) {
    return handleError(err);
  }
}
```

## Field Mapping — avatar / image

> Prisma uses `image` for avatar URLs (TeamMember, Instructor). FE reads `avatar`.
> Every API route that returns TeamMember/Instructor data MUST expose `avatar`.

### Helpers (`@/lib/api/mappings`)

```typescript
import { addAvatar, addAvatarToList, addInstructorAvatar } from "@/lib/api/mappings";

// TeamMember (image → avatar)
return ok(addAvatar(member));
return list(addAvatarToList(members), pagination);

// Instructor (member.image → avatar)
return ok(addInstructorAvatar(instructor));
```

### Rules

| Situation | Use |
|---|---|
| API returns `TeamMember` | `addAvatar(member)` — maps Prisma `image` → FE `avatar` |
| API returns `Instructor` | `addInstructorAvatar(inst)` — maps `inst.member.image` → `inst.avatar` |
| POST creates member, FE sends `avatar` | Extract `avatar` from body, map to `image` in Prisma data |
| Audit log | Log actual DB values (`member`), not cleaned input |
