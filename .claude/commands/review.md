# /review — Code Review

Review changed or specified code for quality, consistency, and adherence to project rules.

**Usage:** `/review [file-or-pattern]`

**What it does:**
1. Check if files match conventions in `.claude/rules/`
2. Verify API response consistency
3. Check auth/permission usage
4. Look for security issues
5. Report findings with actionable fixes

**Examples:**
- `/review src/app/api/admin/orders/route.ts` — review specific file
- `/review src/app/api/` — review all API routes
- `/review --changed` — review all unstaged changes
