# Audit API — Auto-triggered Skill

> **Trigger:** When user asks to "audit APIs", "check API consistency", or "review endpoints"

## Steps

1. **Read** all API route files in `src/app/api/`
2. **Check** each route for:
   - Uses `handleError()` in catch block ✅/❌
   - Returns standard shape `{ data }` or `{ error }` ✅/❌
   - Uses helper functions (`ok`, `badRequest`, etc.) from `@/lib/api` ✅/❌
   - Has auth guard (`requirePermission`, `requireAuth`) ✅/❌
   - List endpoints return pagination ✅/❌
3. **Categorize** findings:
   - ✅ Perfect — follows all conventions
   - ⚠️ Minor — works but could use helpers
   - ❌ Broken — missing error handling or wrong response shape
4. **Fix** minor issues automatically with Edit tool
5. **Report** broken ones for manual review

## Output

```markdown
## 🔍 API Audit Results

### ✅ Perfect (N routes)
[file list]

### ⚠️ Minor Issues (N routes) — auto-fixed
[file list + what was fixed]

### ❌ Broken (N routes) — needs manual review
[file list + issues found + suggested fix]
```
