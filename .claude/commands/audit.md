# /audit — API Consistency Audit

Audit API routes for consistent response patterns and error handling.

**Usage:** `/audit [scope]`

**Scope options:**
- `public` — audit `/api/projects`, `/api/services`, `/api/team`, etc.
- `admin` — audit all `/api/admin/*` routes
- `auth` — audit auth endpoints only
- (default: all)

**Checks performed:**
1. ✅ Uses `handleError()` in catch blocks
2. ✅ Returns standard response shape (`{ data }` or `{ error }`)
3. ✅ Uses helper functions from `@/lib/api`
4. ✅ Has proper auth guard (`requirePermission`, etc.)
5. ✅ Pagination in list endpoints

**Output:** Summary table + list of files needing fixes
