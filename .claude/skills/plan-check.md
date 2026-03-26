# Plan Check — Auto-triggered Skill

> **Trigger:** When user opens PLAN.md, says "check plan", "update plan", or "plan status"

## Steps

1. **Read** `d:/LOOP_COMPANY/LOOP/PLAN.md`
2. **Scan** codebase for any changes that affect plan status
3. **Update** the "Current Implementation Status" section if anything has changed
4. **Verify** each ✅ item is actually implemented:
   - Check `src/lib/api/response.ts` exists and has expected functions
   - Check `src/lib/auth/permissions.ts` exists
   - Check `/api/admin/auth/me` is implemented
5. **Update** timeline table with accurate status
6. **Suggest** next action based on current state

## What to Check

| Item | File to Verify |
|------|---------------|
| API response helpers | `src/lib/api/response.ts` |
| Auth helpers | `src/lib/auth/permissions.ts` |
| Auth/me endpoint | `src/app/api/admin/auth/me/route.ts` |
| Errors.ts | `src/lib/api/errors.ts` |
| API docs | `docs/` folder |

## Output

```markdown
## 📊 PLAN.md Status Check — [date]

### ✅ Verified Complete
[items that are actually done]

### ⚠️ Status Drift
[items marked done but not fully implemented]

### ❌ Not Started
[high-priority items still pending]

### 🎯 Recommended Next Step
[clear actionable next task]
```
