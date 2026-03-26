# Error Handling

## Rules

1. Every async function in API routes MUST have `try/catch`
2. Always use `handleError()` in catch blocks
3. Never swallow errors silently
4. Never `console.error` then return 200 — always return proper error response
5. Errors thrown as `Error` objects, caught with `unknown`

## Error Classes

Use `AuthError` from `@/lib/auth/permissions` for auth failures:
```typescript
import { AuthError } from "@/lib/auth/permissions";

if (!session) throw new AuthError("Unauthorized", 401);
if (!hasPermission) throw new AuthError("Forbidden", 403);
```

Use `ApiError` (when created) for business logic errors:
```typescript
import { ApiError } from "@/lib/api/errors";

throw new ApiError(400, "Invalid status transition", "INVALID_TRANSITION");
```

## handleError() Usage

```typescript
// API routes
export async function GET(req: Request) {
  try {
    const data = await getData();
    return ok(data);
  } catch (err) {
    return handleError(err);
  }
}
```

## Message Guidelines

- Error messages: lowercase, no trailing punctuation, no articles
  - ✅ `"user not found"`
  - ❌ `"User not found."` / `"The user was not found"`
- Client errors (400): descriptive but safe to show user
- Server errors (500): generic in response, log detail server-side

## Retry Logic

For transient errors (DB connection), retry once:
```typescript
async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0 && isTransientError(err)) {
      await sleep(500);
      return withRetry(fn, retries - 1);
    }
    throw err;
  }
}
```

Neon DB already handled in `/auth/me` — no need to retry elsewhere unless critical.
