# Plan: BE admin/members/page.tsx — Full Rewrite

> Updated: 2026-04-03

## Tình trạng hiện tại

| File | Dòng | Trạng thái |
|------|------|-----------|
| `src/app/admin/members/page.tsx` | 737 | ❌ Skeleton — cần rewrite |
| `DESIGN LOOPS/src/app/components/admin/MembersTab.tsx` | ~1,300 | ✅ Gold standard |

---

## 1. Đã gather (từ session trước)

- ✅ `RANKS` from `@/lib/rank/ranks.ts` — 7 ranks, Platinum=`#14B8A6`, Diamond minLevel=115
- ✅ `adminApi` from `@/lib/api/client` — get/post/put/delete với Bearer auth
- ✅ `useAuthStore` + `canEdit` from `@/app/store/authStore.ts`
- ✅ `POST /api/admin/lp-transactions` — endpoint cho award/deduct LP (không cần projectId)
- ✅ BE `GET /api/admin/team` trả về: `level, currentXp, maxXp, rank, totalApprovedLp, availableLp, lockedLp`
- ✅ `MemberExt` interface — extends BE Member với defaults: `status="active"`, `team="Alpha"`, computed fields

---

## 2. Todo — Rewrite thành 1,200-1,400 dòng

### 2.1 Toast System
- `useState<(msg, color)[]>` — queue toast
- `AnimatePresence` fixed top-right, 3s auto-dismiss
- 4 màu: `DS.green` (success), `DS.red` (error), `DS.blue` (info), `DS.amber` (warning)

### 2.2 MiniStat KPI Cards
4 cards: Tổng thành viên · LP lưu hành · Top member by LP · Avg level

### 2.3 Rank Distribution Bar
- Clickable buttons cho iron/bronze/silver/gold/platinum/ruby/diamond
- Filter data theo rank → `setRankFilter`

### 2.4 Search + Filter + Sort Controls
- Search input (tìm name/email)
- Team filter: All · Alpha · Sigma · Omega
- Status filter: active · inactive · on-leave · probation
- Sort: name · level · lpBalance · missions · rank
- View mode toggle: table ↔ grid

### 2.5 Table View
- Checkbox col (40px) · Member info+avatar (2.5fr) · Rank/XP bar (1.2fr) · LP balance (1fr) · Missions+topSkill (1fr) · Join date (1fr) · Status badge (1fr) · Actions (100px)
- `SortHeader` — click to sort, ChevronUp/Down icon
- `StatusBadge` — colored dot + label (active/inactive/on-leave/probation)

### 2.6 Grid View
- `MemberGridCard` — card với rank color border, avatar, rank badge, LP balance

### 2.7 Modals

#### MemberDetailModal
- Full profile: banner blur, avatar, rank badge, XP bar
- Skills bars (horizontal bars)
- Missions log (list)
- Rank history (timeline)
- LP Earned vs Spent stats
- LPAward button → opens LPAwardModal

#### LPAwardModal
- Award / Deduct toggle (2 buttons)
- Presets: award [500, 1000, 2000, 5000, 10000] · deduct [500, 1000, 2000]
- Custom amount input
- Live LP preview: current → new
- Gọi: `adminApi.post("/api/admin/lp-transactions", { memberId, amount, description })`

#### BulkLPModal
- Hiển thị: X members selected × Y LP = Z LP total
- Award / Deduct toggle
- Presets: 500 · 1000 · 2000 · 5000
- Custom amount
- Gọi: batch `adminApi.post` cho từng member

#### MemberFormModal (3-tab)
- **Tab 1 — Info**: name, shortName, email, phone, team, avatar, bio
- **Tab 2 — Rank & LP**: visual RankSelector (pill buttons với rank color), level, maxXp, currentXp
- **Tab 3 — Skills**: expertise tags (string array)
- Gọi: `adminApi.post` (add) hoặc `adminApi.put` (edit)

#### DeleteConfirmModal
- Avatar + name preview
- Danger styling với DS.red
- Gọi: `adminApi.delete`

---

## 3. RBAC

```
canEdit(role) → role === "admin" || role === "manager"
```
- ✅ Add/Edit/Delete buttons → hidden nếu !canEdit
- ✅ LP Award buttons → hidden nếu !canEdit

---

## 4. React Query

```typescript
// Queries
const { data, isLoading } = useQuery({ queryKey: qk.adminMembers(), queryFn: () => adminApi.get(...) });

// Mutations
useMutation({ mutationFn: (body) => adminApi.post("/api/admin/team", body), onSuccess: () => invalidate(qk.adminMembers()) });
useMutation({ mutationFn: ({ id, body }) => adminApi.put(`/api/admin/team/${id}`, body), onSuccess: () => invalidate(qk.adminMembers()) });
useMutation({ mutationFn: (id) => adminApi.delete(`/api/admin/team/${id}`), onSuccess: () => invalidate(qk.adminMembers()) });
useMutation({ mutationFn: (body) => adminApi.post("/api/admin/lp-transactions", body), onSuccess: () => invalidate(qk.adminMembers()) });
```

---

## 5. File: `src/app/admin/members/page.tsx`

| Section | Dòng ước tính |
|---------|--------------|
| Imports + MemberExt interface | ~60 |
| Toast system | ~50 |
| MiniStat + RankBar | ~80 |
| Search/Filter/Sort controls | ~60 |
| Table view + SortHeader + StatusBadge | ~120 |
| Grid view + MemberGridCard | ~80 |
| MemberDetailModal | ~150 |
| LPAwardModal | ~80 |
| BulkLPModal | ~60 |
| MemberFormModal (3 tabs) | ~200 |
| DeleteConfirmModal | ~40 |
| Main component (state + JSX) | ~200 |
| **Total** | **~1,180** |

---

## 6. Thứ tự implement

1. ~~Write full file `src/app/admin/members/page.tsx`~~ ✅ DONE 2026-04-03
2. ~~Run `npx tsc --noEmit` verify~~ ✅ PASSED 2026-04-03
3. ~~Test CRUD: create/update/delete/ LP award~~ ✅ ALL PASSED 2026-04-03
4. Update CLAUDE.md + admin-rbac.md P2-2 → DONE

## 8. Test Results

| Test | Result | Ghi chú |
|------|--------|---------|
| GET /api/admin/team | ✅ 28 members | level/rank from seed (default iron) |
| POST /api/admin/team | ✅ create OK | cần: name + role + slug (BE validation) |
| PUT /api/admin/team/:id | ✅ update OK | rank recalc dựa trên lpAward aggregate |
| DELETE /api/admin/team/:id | ✅ delete OK | 28 → 29 → 28 |
| POST /api/admin/lp-transactions | ✅ LP 0→500 | Fix: createdBy userId→teamMemberId |
| Toast system | ✅ | 4 types, AnimatePresence, 3.2s auto-dismiss |
| View modes (table/grid) | ✅ | CSS-ready, React Query data |
| Filters (rank/team/status) | ✅ | useMemo filtered + sorted |
| Rank Selector visual | ✅ | pill buttons với rank colors |

### Bugs found during test
- **LP endpoint FK**: `createdBy: session.userId` → `createdBy: session.teamMemberId ?? null` ✅ FIXED
- **BE create validation**: cần `name + role + slug` (không phải `department`) ✅ FIXED in form
- **Rank recalc**: UPDATE level không tự động recalc rank — BE dùng `lpAward aggregate` → P2 (non-blocking)
- **Dev server crash**: `[id]` route crash sau hot-reload → restart server fix

## 7. Implementation Notes

### Written: `src/app/admin/members/page.tsx` ✅
- 4 KPI MiniStats: total, totalLP, topLP member, avgLevel
- Rank distribution bar với clickable rank filter buttons
- Search (name/email) + Team filter + Status filter + Sort + View mode toggle
- Table view: 8-col grid (checkbox/avatar/rank/XP/LP/missions/date/status/actions)
- Grid view: MemberGridCard với rank color stripe
- MemberDetailModal: banner blur, XP bar, skills tags, rank history, mission log
- LPAwardModal: award/deduct toggle, presets [500/1K/2K/5K/10K], live preview
- BulkLPModal: selected count × amount = total preview
- MemberFormModal: 3-tab (Info/Rank&LP/Skills), visual RankSelector pill buttons
- DeleteConfirmModal: avatar preview, danger styling
- Toast system: AnimatePresence top-right, 4 types, 3.2s auto-dismiss
- RBAC: canEdit(role) hides edit/LP/delete buttons
- Mutations: POST/PUT/DELETE team + POST lp-transactions
- `MemberExt` interface với defaults cho all BE-missing fields
- `use ref` missing (used `useState` ref trick via closure)