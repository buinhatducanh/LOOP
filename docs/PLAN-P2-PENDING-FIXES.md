# Plan: P2 Deferred Tasks — Full Fix Plan

> Created: 2026-04-04
> Status: PENDING — all tasks non-blocking (system works without them)
> Priority: HIGH → P2-1, P2-3, P2-5, P2-7, P2-8
> Priority: MEDIUM → P2-4, P2-6, P2-9, P2-10
> Priority: LOW → P2-1 (additional)

---

## P2-1: Admin Overview — Real KPIs ✅ GATHERED

**File:** `src/app/admin/overview/page.tsx` (737L)

### Hardcoded values found
```typescript
// Line 280
{ label: "Doanh thu tháng", value: "124.5M", ... }
// Line 401
<StatChip label="Hoàn thành" value={12} color="#22C55E" />
```

### Source of truth
- `src/app/admin/revenue/page.tsx` line 134-136 — real computation:
  ```typescript
  const totalRevenue = orders
    .filter((o: Order) => isThisMonth(o.createdAt))
    .reduce((sum, o) => sum + (o.totalAmount ?? 0), 0);
  ```

### Fix needed
1. Add `isThisMonth(date)` helper
2. Add `monthRevenue` computed from `orders` (already fetched)
3. Add `doneCount` = `orders.filter(o => o.status === "done").length`
4. Replace `"124.5M"` → `{fmtVND(monthRevenue)}`
5. Replace `value={12}` → `{doneCount}`
6. Add `pendingCount` = orders pending_payment

### Estimated: ~20 lines change

---

## P2-3: LP Award Status → Pending ✅ GATHERED

**File:** `src/lib/pricing/quote-to-order.ts`

### Bug
```typescript
// Line 119 + 200
status: "approved",   // ← bypasses PM approval workflow
```

### Fix
Change `status: "approved"` → `status: "pending"` in both locations.
PM will review LP awards before they are credited (similar to expense approval flow).

### Impact
- Staff LP balance won't update automatically until PM approves in AdminLeaderboardTab
- Need to verify AdminLeaderboardTab has a "pending LP" review flow
- Check: `AdminLeaderboardTab` — does it show pending awards and have approve/reject buttons?

### Estimated: 2 words change (but verify downstream impact)

---

## P2-4: Sitemap — Missing Routes ✅ DONE 2026-04-04

**File:** `src/app/sitemap.ts` (136L)

### Missing routes
```typescript
// Need to add:
{ path: "hoc-vien",      priority: 0.9, changeFrequency: "monthly" as const },
{ path: "dat-lich",       priority: 0.9, changeFrequency: "monthly" as const },
// Also dynamic team slugs:
{ path: "doi-ngu",         priority: 0.7, changeFrequency: "weekly" as const },
```

### Also needed: dynamic team member slugs
```typescript
// After service slugs, add:
const members = await prisma.teamMember.findMany({
  where: { isActive: true },
  select: { slug: true },
});
for (const locale of locales) {
  for (const member of members) {
    urls.push({
      url: `${baseUrl}/${locale}/doi-ngu/${member.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    });
  }
}
```

### Estimated: ~15 lines

---

## P2-5: Edge JWT Verify → jose ⚠️ SECURITY

**File:** `src/lib/auth/edge.ts`

### Current state
Code itself documents the security risk in comments. Uses `decodeJwtPayload()` (decode only, no signature verification). Attacker can forge tokens to bypass Edge Middleware routing.

### Fix approach
```bash
npm install jose
```

```typescript
// Replace decodeJwtPayload with verifyJwt:
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const { payload } = await jwtVerify(token, secret);
// payload = verified, cryptographically signed
```

### Files to change
- `src/lib/auth/edge.ts` — replace decodeJwtPayload calls
- Verify `JWT_SECRET` exists in env

### ⚠️ Test carefully — JWT verification failures will block all authenticated routes

### Estimated: ~30 lines

---

## P2-6: JA/KO/ZH i18n Cleanup ⚠️ NATIVE SPEAKER NEEDED

**Files:** `src/i18n/messages/ja.json` (869L), `src/i18n/messages/ko.json`

### Issues known
- Cyrillic `д` in Japanese FAQ section
- Chinese characters in Korean LP section

### Cannot fix without native speaker review.标记 pending for:
- [ ] JA → Native Japanese speaker review
- [ ] KO → Native Korean speaker review
- [ ] ZH → Chinese reader spot-check

### Quick scan commands (for reference):
```bash
# Find non-Japanese characters in ja.json
grep -P '[^\p{Hiragana}\p{Katakana}\p{Han}\p{Latin}\p{Ndigit}\p{Punctuation}\s]' \
  src/i18n/messages/ja.json | head -20

# Find non-Korean in ko.json
grep -P '[^\p{Hangul}\p{Han}\p{Latin}\p{Ndigit}\p{Punctuation}\s]' \
  src/i18n/messages/ko.json | head -20
```

---

## P2-7: Academy LP Award = 0 Fix

**File:** `src/app/api/academy/enroll/route.ts` (198L)

### Current state
Enroll route correctly deducts LP from customer when paying with LP. BUT it does NOT award LP to staff/member who enrolled (LP as reward for learning).

### Fix needed
After successful enrollment payment, award LP to the enrolled member:
```typescript
// After enrollment.create() success:
// Award LP reward for course completion (triggered when student finishes course)
if (course.lpReward) {
  await prisma.lpAward.create({
    data: {
      memberId: session.teamMemberId,  // or creator from enrollment
      lpAmount: course.lpReward,
      type: "academy",
      status: "completed",
      description: `Hoàn thành khóa học: ${course.title}`,
      awardedBy: session.teamMemberId,
    }
  });
  // Update member LP balance
  await prisma.teamMember.update({
    where: { id: session.teamMemberId },
    data: { availableLp: { increment: course.lpReward } },
  });
}
```

### Also: call `syncRankFields()` after LP deduction
When customer pays with LP (mixed or full LP), their rank/level should update:
```typescript
// After LP deduction in enroll:
await syncRankFields(session.teamMemberId);
```

### Estimated: ~25 lines

---

## P2-8: `redeemLp()` Missing `syncRankFields()`

**File:** `src/lib/services/customer/lp.service.ts` (264L)

### Current functions
- `awardCustomerLpOnPayment` (line 84)
- `awardCustomerLpOnOrderComplete` (line 197)

### Fix needed
After deducting LP (redemption), call `syncRankFields()`:
```typescript
// After LP deduction in any redemption function:
// Find syncRankFields in /lib/rank/xp.ts
import { computeRankFieldsFromLp } from '@/lib/rank/xp';

// After balance update:
const lpAgg = await prisma.lpAward.aggregate({
  where: { memberId, status: 'approved' },
  _sum: { lpAmount: true },
});
const totalLp = lpAgg._sum.lpAmount ?? 0;
const { level, currentXp, maxXp, rank } = computeRankFieldsFromLp(totalLp);
await prisma.teamMember.update({
  where: { id: memberId },
  data: { level, currentXp, maxXp, rank },
});
```

### Check first: does redemption flow already update rank?
```bash
grep -n "syncRankFields\|rank\|level" src/lib/services/customer/lp.service.ts
```

### Estimated: ~20 lines

---

## P2-9: Quest Frequency Reset Cron

**File:** `src/lib/jobs/functions.ts` (396L) — MISSING

### What needs to exist
```typescript
// New function in functions.ts:

export const questFrequencyReset = inngest.createFunction(
  { id: "quest-frequency-reset", name: "Quest Frequency Reset" },
  { cron: "0 0 * * *" },  // Daily at midnight
  async ({ step }) => {
    const today = new Date();
    const isMonday = today.getDay() === 1;
    const isFirstOfMonth = today.getDate() === 1;

    // Daily: reset daily quests
    await step.run("reset-daily", async () => {
      await prisma.questParticipant.updateMany({
        where: {
          quest: { frequency: "daily" },
          completed: false,
        },
        data: { progress: 0 },
      });
    });

    // Weekly (Monday): reset weekly quests
    if (isMonday) {
      await step.run("reset-weekly", async () => {
        await prisma.questParticipant.updateMany({
          where: {
            quest: { frequency: "weekly" },
          },
          data: { progress: 0, completed: false },
        });
      });
    }

    // Monthly (1st): reset monthly quests
    if (isFirstOfMonth) {
      await step.run("reset-monthly", async () => {
        await prisma.questParticipant.updateMany({
          where: {
            quest: { frequency: "monthly" },
          },
          data: { progress: 0, completed: false },
        });
      });
    }
  }
);
```

### Add to `allJobs` array:
```typescript
export const allJobs = [
  // ... existing 8 jobs ...
  questFrequencyReset,
];
```

### Estimated: ~50 lines

---

## P2-10: Event `lpBonus` Auto-Award

**File:** `src/lib/jobs/functions.ts` — MISSING

### What needs to exist
```typescript
// New function in functions.ts:

export const eventLpBonusAward = inngest.createFunction(
  { id: "event-lp-bonus-award", name: "Event LP Bonus Award" },
  { cron: "0 1 * * *" },  // Daily at 1am
  async ({ step }) => {
    // Find events that ended yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    const endedEvents = await step.run("find-ended-events", async () => {
      return prisma.companyEvent.findMany({
        where: {
          endDate: { lte: yesterday },
          active: true,
        },
        include: { quests: { select: { id: true } } },
      });
    });

    for (const event of endedEvents) {
      await step.run(`award-lp-${event.id}`, async () => {
        // Get all participants who completed all quests
        const participants = await prisma.questParticipant.findMany({
          where: {
            eventId: event.id,
            completed: true,
          },
          select: { userId: true },
        });

        // Award lpBonus to each
        await Promise.all(participants.map(async (p) => {
          // Find member by userId
          const member = await prisma.teamMember.findFirst({
            where: { user: { id: p.userId } },
          });
          if (!member) return;

          await prisma.lpAward.create({
            data: {
              memberId: member.id,
              lpAmount: event.lpBonus,
              type: "event",
              status: "completed",
              description: `Event bonus: ${event.title}`,
              awardedBy: null,
            },
          });
          await prisma.teamMember.update({
            where: { id: member.id },
            data: { availableLp: { increment: event.lpBonus } },
          });
        }));

        // Deactivate event
        await prisma.companyEvent.update({
          where: { id: event.id },
          data: { active: false },
        });
      });
    }
  }
);
```

### Add to `allJobs` array

### Estimated: ~60 lines

---

## Summary — Implement Order

| # | Task | Lines | Priority | Dependency |
|---|------|-------|----------|-----------|
| P2-1 | Overview real KPIs | ~20 | HIGH | ✅ DONE |
| P2-4 | Sitemap missing routes | ~15 | MEDIUM | ✅ DONE |
| P2-3 | LP status pending | ~2 | HIGH | ✅ DONE |
| P2-5 | Edge JWT jose | ~30 | HIGH | ✅ DONE |
| P2-7 | Academy LP award | ~25 | HIGH | ✅ DONE |
| P2-8 | redeemLp syncRankFields | ~20 | HIGH | ✅ DONE |
| P2-9 | Quest reset cron | ~50 | MEDIUM | ✅ DONE |
| P2-10 | Event lpBonus auto | ~60 | LOW | ✅ DONE |
| P2-6 | JA/KO/ZH cleanup | — | MEDIUM | ✅ DONE (fixes applied; native review still recommended) |

---

## Pre-implementation Checklist (before starting each)

- [ ] Read relevant rule files first (loop-business-logic.md, code-style.md, error-handling.md, security.md)
- [ ] Verify file still exists at expected path
- [ ] Run `npx tsc --noEmit` before and after changes
- [ ] Test with curl/admin panel after changes
- [ ] Update this plan's status after each P2 is completed
