# Create API Doc — Auto-triggered Skill

> **Trigger:** When user asks to "create API docs", "write documentation", "document endpoints"

## Context

LOOP website has 150+ API endpoints. API docs are **blocking FE development** — must be created first.

## Steps

1. **Read** all route files in `src/app/api/` recursively
2. **Read** `PLAN.md` for endpoint list and auth patterns
3. **Read** `src/lib/api/response.ts` for response shape reference
4. **Create** `docs/API-CONTRACT.md` with:
   - Table of all endpoints (method, path, auth, description)
   - Response shapes (success + error)
   - Auth context shape (`GET /api/admin/auth/me`)
   - Pagination convention
   - Request/response examples for key endpoints
5. **Create** `docs/DATA-MODELS.md` with:
   - Entity tables from Prisma schema
   - Field types and descriptions
   - Relations between models
   - Example JSON for each entity
6. **Create** `docs/PERMISSION-MATRIX.md` with:
   - Role hierarchy
   - Role × resource × action matrix
   - How to check permissions in code

## Priority Order

1. `docs/API-CONTRACT.md` — highest priority
2. `docs/DATA-MODELS.md` — high priority
3. `docs/PERMISSION-MATRIX.md` — high priority

## Output

After creation, show:
```
## ✅ Documentation Created

| File | Path | Status |
|------|------|--------|
| API Contract | docs/API-CONTRACT.md | ✅ |
| Data Models | docs/DATA-MODELS.md | ✅ |
| Permission Matrix | docs/PERMISSION-MATRIX.md | ✅ |

Frontend team có thể bắt đầu integration!
```
