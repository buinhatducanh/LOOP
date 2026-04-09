# LOOP Business Logic — Source of Truth

> **Version**: 9.0.0 · Updated: 2026-04-10
> **Status**: Split into 2 focused files (2026-04-10). Read the appropriate file for your context.

---

## File Map

| File | Sections | Content |
|------|----------|---------|
| `loop-business-logic-core.md` | 1–13 | Orders, Kanban, LP, Rank, Quest (v7), RBAC v4, Revenue Split, E2E lifecycle |
| `loop-quest-vip-system.md` | 14–20 | Staff Quest 3-scopes (v8), Customer VIP tiers, Prisma models, API routes |

---

## Quick Reference

### LP Sources

| Nguồn | Staff | Client |
|--------|:-----:|:------:|
| Order done | — | ✅ |
| Kanban task | ✅ | — |
| OffSystemPayment | ✅ | — |
| Admin manual | ✅ | — |
| Điểm danh | ✅ | ✅ |
| Staff Quest | **XP** | — |
| Client Quest | — | **LP + VIP pts** |

### Rank (Iron → Diamond)

| Rank | Color | Level | LP/Level |
|------|-------|-------|----------|
| Iron | `#9CA3AF` | 1–14 | 100 |
| Bronze | `#CD7F32` | 15–34 | 350 |
| Silver | `#CBD5E1` | 35–54 | 800 |
| Gold | `#FFD700` | 55–74 | 2,000 |
| Platinum | `#14B8A6` | 75–94 | 5,000 |
| Ruby | `#EF4444` | 95–114 | 12,000 |
| Diamond | `#818CF8` | **115+ uncapped** | 30,000 |

### VIP Tiers (Customer)

| Tier | Min Spending | VIP Points | Discount Cap |
|------|------------|------------|-------------|
| regular | 0 | 0 | 10% |
| vip1 | 10M | 100 | 15% |
| vip2 | 50M | 500 | 20% |
| vip3 | 100M | 1,000 | 25% |

### Staff Quest Scopes (v8)

```
Company-wide  → XP chia đều, tất cả staff
Department    → XP chia đều trong phòng
Personal      → XP toàn phần cho cá nhân
```

### Order Status Lifecycle

```
pending_payment → paid → in_progress → demo_ready → client_review → done
```

### RBAC Roles (v4)

```
ceo(-1) → super_admin(0) → admin(1) → hr(2) → pm(3) → media(4) → qa(5) → member(6)
```
