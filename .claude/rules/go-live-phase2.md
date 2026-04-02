# Phase 2 — Post-Launch Tasks

> Status: NOT STARTED | Priority: P2 (non-blocking)
> These are polish/improvement items — system works without them.

---

## P2-1: Admin Overview — Replace hardcoded KPIs with real data

**File:** `src/app/admin/overview/page.tsx`

Revenue "124.5M" + stat chips (3/7/5/12) are hardcoded strings.
Port the real computation logic from `admin/revenue/page.tsx` into Overview.

---

## P2-2: Members Tab — Add/Edit modal handlers

**File:** `src/app/admin/members/page.tsx`

Edit + Add buttons have UI but no `onClick` handlers.
Need to create member CRUD modal wired to `/api/admin/team` POST/PUT.

---

## P2-3: `distributeLpFromOrder()` — Create pending awards not approved

**File:** `src/lib/pricing/quote-to-order.ts`

LP distribution currently creates awards with `status: "approved"` directly — bypasses PM approval workflow.
Fix: create with `status: "pending"` so PM can review before LP is credited.

---

## P2-4: Sitemap — Add `academy` + `/booking` routes

**File:** `src/app/sitemap.ts`

Missing `academy` + `/booking` static routes.
Add with `priority: 0.9` and `changeFrequency: "monthly"`.

---

## P2-5: JWT edge verification — Use `jose` instead of `jsonwebtoken`

**File:** `src/lib/auth/edge.ts`

Edge Middleware decodes JWT without verifying signature — attacker can forge tokens.
Replace `jsonwebtoken` (Node.js only) with `jose` (Edge-compatible) for proper signature verification.

---

## P2-6: JA/KO/ZH mixed-script character cleanup

**Files:** `src/i18n/messages/ja.json`, `src/i18n/messages/ko.json`

Garbled strings: Cyrillic `д` in Japanese FAQ, Chinese characters in Korean LP section.
Requires native speaker review.

---

## P2-7: Academy LP award amount = 0 fix

**File:** `src/app/api/academy/enroll/route.ts`

Course enrollment creates `EduPayment` but `lpAwarded = 0`.
Need to compute and award LP based on course price × rate after enrollment payment.
Also need to call `syncRankFields()` after LP deduction (member spending LP on education).

---

## P2-8: `redeemLp()` does not call `syncRankFields()`

**File:** `src/lib/services/customer/lp.service.ts` (or redemption service)

After deducting LP via redemption, member rank/XP fields are not recalculated.
Call `syncRankFields()` after LP spend.

---

## P2-9: Quest frequency reset — daily/weekly/monthly cron

**Files:** `src/app/api/inngest/route.ts`

Quests have frequency (daily/weekly/monthly) but no reset mechanism.
Need Inngest cron to reset `QuestParticipant.progress` and `completed` fields.
Daily quests reset every 24h, weekly every Monday, monthly on 1st of month.

---

## P2-10: Company Event `lpBonus` auto-award

**Files:** `src/app/api/inngest/route.ts`

When a Company Event ends, all participants should receive the `lpBonus` automatically.
Cron job on event `endDate` to credit LP to all participants who completed.
