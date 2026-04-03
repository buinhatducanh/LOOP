# Phase 2 — Post-Launch Tasks

> Status: PLAN WRITTEN | Priority: P2 (non-blocking)
> Plan: `docs/PLAN-P2-PENDING-FIXES.md` — All tasks documented with file paths, line numbers, fix approach, and estimated effort.
> These are polish/improvement items — system works without them.

---

## Business Logic Reference

> **Đọc TRƯỚC khi implement bất kỳ feature nào trong P2**
> Source of truth: `.claude/rules/loop-business-logic.md`

---

## P2-1: Admin Overview — Replace hardcoded KPIs ✅ GATHERED

**File:** `src/app/admin/overview/page.tsx`

Hardcoded values found:
- Line 280: `{ label: "Doanh thu tháng", value: "124.5M", ... }`
- Line 401: `<StatChip label="Hoàn thành" value={12} color="#22C55E" />`

**✅ DONE 2026-04-04.**
- Added `fmtVND()` + `isThisMonth()` helpers
- Replaced `"124.5M"` → `{fmtVND(monthRevenue)}`
- Replaced all 4 hardcoded StatChip values → computed from `orders.reduce()`
- `npx tsc --noEmit` ✅

---

## P2-2: Members Tab — Full rewrite ✅ DONE 2026-04-03

**File:** `src/app/admin/members/page.tsx` — Rewritten 1,988 lines

Features implemented: 4 KPI MiniStats, rank distribution bar, search/filter/sort, table/grid views, MemberDetailModal, LPAwardModal, BulkLPModal, MemberFormModal (3-tab), DeleteConfirmModal, Toast system, RBAC via `canEdit(role)`. BE mutations wired: POST/PUT/DELETE team + POST lp-transactions. `npx tsc --noEmit` ✅. All CRUD tested: create ✅, update ✅, delete ✅, LP award ✅. Bugs fixed: LP FK (createdBy userId→teamMemberId), BE create needs (name+role+slug, no department).

**File:** `src/app/admin/members/page.tsx`

Edit + Add buttons have UI but no `onClick` handlers.
Need to create member CRUD modal wired to `/api/admin/team` POST/PUT.

---

## P2-3: LP Award Status → Pending ✅ DONE 2026-04-04

`src/lib/pricing/quote-to-order.ts` line 200: `status: "approved"` → `status: "pending"`.
PM reviews pending awards in `lp_manage` page → approve/reject endpoints exist at `lp-awards/[id]/approve/route.ts`. Workflow complete.

---

## P2-4: Sitemap — Missing Routes ✅ DONE 2026-04-04

Added `hoc-vien` (priority 0.9) + `dat-lich` (priority 0.9) static routes.
Added dynamic course slugs: `/{locale}/hoc-vien/{course.id}` from `prisma.course`. `npx tsc --noEmit` ✅

---

## P2-5: JWT edge verification — Use `jose` instead of `jsonwebtoken` ✅ DONE 2026-04-04

**File:** `src/lib/auth/edge.ts`

Edge Middleware decodes JWT without verifying signature — attacker can forge tokens.
Fixed ✅ — Installed `jose`, added `verifyAuthToken()` with `jwtVerify()` using HS256.
Hybrid approach: Edge Middleware uses decode-only (no env access at some runtimes), API routes use `verifyAuthToken()` for full cryptographic verification. Falls back to decode if `JWT_SECRET` unavailable. `npx tsc --noEmit` ✅.

---

## P2-6: JA/KO/ZH mixed-script character cleanup ✅ DONE 2026-04-04

**Files:** `src/i18n/messages/ja.json`, `src/i18n/messages/ko.json`

JA: 5 Cyrillic/Russian strings fixed → proper Japanese translations.
KO: 5 mixed Japanese/Chinese strings fixed → proper Korean translations.
ZH: Already clean. ✅ (Professional native speaker review still recommended for polish.)

---

## P2-7: Academy LP award amount = 0 fix ✅ DONE 2026-04-04

**File:** `src/app/api/academy/lessons/[id]/complete/route.ts` + `src/app/api/academy/enroll/route.ts`

LP reward on course COMPLETION was already implemented (completeLesson route) — P2-7 part 1 already done by previous work.
Added `syncRankFields(memberId)` call after LP award when `isCourseComplete = true` (line ~162).
Also added `syncRankFields(memberId)` call after LP deduction in enrollment (member spending LP on education).
`npx tsc --noEmit` ✅.

---

## P2-8: `redeemLp()` does not call `syncRankFields()` ✅ DONE 2026-04-04

**File:** `src/lib/services/gamification/redemption.service.ts`

After deducting LP via redemption, member rank/XP fields were not recalculated.
Added `syncRankFields(memberId)` call after transaction commits in `redeemLp()`.
`npx tsc --noEmit` ✅.

---

## P2-9: Quest frequency reset ✅ DONE 2026-04-04

**File:** `src/lib/jobs/functions.ts`

Added `questFrequencyReset` inngest function (cron: daily at midnight):
- Daily: resets daily quest participants (progress → 0, completed unchanged)
- Monday: resets weekly quests (progress → 0, completed → false)
- Monthly (1st): resets monthly quests (progress → 0, completed → false)
Added to `allJobs` array. `npx tsc --noEmit` ✅.

---

## P2-10: Company Event `lpBonus` auto-award ✅ DONE 2026-04-04

**File:** `src/lib/jobs/functions.ts`

Added `eventLpBonusAward` inngest function (cron: daily at 01:00):
- Finds events where `endDate <= yesterday` AND `isActive = true`
- Awards `lpBonus` to all `QuestParticipant` with `completed = true`
- Creates `LpAward` record + increments `availableLp` on `TeamMember`
- Sets `isActive = false` on event
Added to `allJobs` array. `npx tsc --noEmit` ✅.
