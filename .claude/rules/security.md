# Security Rules

## Hard Rules

- ❌ **NEVER** log credentials, tokens, API keys, or secrets
- ❌ **NEVER** return sensitive user data (passwords, tokens) in API responses
- ❌ **NEVER** use `eval()` or `new Function()`
- ❌ **NEVER** trust client input — always validate server-side
- ❌ **NEVER** expose internal error details to clients in production

## Authentication

- All `/api/admin/*` routes require JWT or NextAuth session
- Use `requirePermission(resource, action)` for resource-level auth
- Use `requireAuth()` for routes needing authentication only
- Never trust `req.headers` alone for auth — use session helpers

## Input Validation

```typescript
// Validate IDs (prevent injection, invalid format)
const id = req.nextUrl.searchParams.get("id");
if (!id || !id.startsWith("cl")) {
  return badRequest("Invalid ID");
}

// Validate body
const body = await req.json();
if (!body.email || typeof body.email !== "string") {
  return badRequest("Email is required");
}
```

## SQL / Prisma

- Never interpolate user input into Prisma queries
- Always use Prisma's parameterized queries (they are safe by default)
- Use `where` clauses with typed inputs, not raw SQL strings

## File Uploads

- Validate file type server-side (don't trust `Content-Type` header)
- Validate file size limits
- Use signed URLs from Cloudinary for media — never expose raw uploads
- Scan uploads for malicious content if handling user-uploaded files

## Rate Limiting

- Public endpoints: 100 req/min per IP (Upstash Redis)
- Admin endpoints: 1000 req/min per user
- Auth endpoints: stricter limits (5 req/min per IP)

## Environment Variables

- Never commit `.env` files
- Use `.env.example` with all keys except actual values
- Access via `process.env.VARIABLE_NAME` (server-side only)
- Prefix client-safe vars with `NEXT_PUBLIC_`

## Project Member Assignment

- Only admin/ceo can assign PM role (`projectRoleKey: "pm"`)
- Only admin/ceo/pm can assign dev/qa/designer roles
- PM cannot remove themselves from a project
- GitHub branch naming convention: `task-{taskId}-{slug}`

## eKYC Data

- eKYC fields (`ekycName`, `ekycIdNumber`, `ekycDob`, `ekycAddress`) are PII — do NOT log them
- Store in `CustomerWebsite.ekyc*` fields; application-level encryption recommended for production
- CustomerWebsite access: customer owns their own record; admin sees all

## SSE Endpoint Security

- `/api/admin/events/stream` requires valid Bearer token (requireAuth)
- Each SSE connection validated before event stream starts
- 5-minute server-side timeout prevents orphaned streams
- Heartbeat (`ping` event) every 25s keeps proxies from closing idle connections
