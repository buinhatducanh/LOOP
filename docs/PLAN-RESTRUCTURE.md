# Plan: Tái cấu trúc Source Code LOOP

> **Version**: 1.1.0 · **Status**: VERIFIED — thực hiện sau khi xác minh chi tiết
> **Scope**: Toàn bộ codebase · **Ngày**: 2026-04-04
> **Mục tiêu**: Dọn dẹp duplicate, chuẩn hóa cấu trúc, loại bỏ confusion risk
>
> **Verification done:** 2026-04-04 · Agent: Explore · All 10 issues confirmed with exact file counts, MD5 hashes, import traces.

---

## 1. Hiện trạng — Bức tranh toàn cảnh

```
d:/LOOP_COMPANY/LOOP/
├── FE/                    # ⚠️ Prototype Vite (legacy, gần giống DESIGN LOOPS)
├── DESIGN LOOPS/          # ⚠️ Prototype Vite (design reference, gần giống FE)
├── src/                   # ✅ PRODUCTION — Next.js 15
│   ├── app/               # Pages (App Router)
│   ├── components/        # Shared components
│   ├── lib/               # Business logic, DB, auth, jobs
│   ├── i18n/messages/    # i18n JSON (5 locales)
│   └── ...                # styles, types, middleware, etc.
├── messages/              # ⚠️ Duplicate i18n JSON (không dùng)
├── src/messages/          # ⚠️ Duplicate i18n JSON (không dùng)
├── docs/                  # 29 file docs
└── prisma/                # Schema + migrations + seed
```

---

## 2. Xác minh — Các vấn đề cấu trúc (Issues)

> ⚠️ **Verification: 2026-04-04** — Tất cả findings được xác minh bằng grep, file read, MD5 hash.
> `src/i18n/messages/` = ACTIVE runtime; `src/messages/` = DEAD; root `messages/` = test-only; 49 UI files byte-for-byte identical across all 3 locations.

### Issue A — Hai prototype Vite gần trùng lặp ✅ VERIFIED

| | `FE/` | `DESIGN LOOPS/` |
|---|---|---|
| **Mục đích** | FE mock ban đầu | Design reference |
| **Framework** | Vite + React 18 | Vite + React 18 |
| **UI components** | **49 files** | **49 files** — byte-for-byte identical (MD5 hash verified) |
| **Admin tabs** | **26 files** | **26 files** — byte-for-byte identical |
| **Khác biệt** | Có `LocaleSwitcher.tsx` | Không có `LocaleSwitcher.tsx` |
| **Dùng trong prod?** | ❌ Không | ❌ Không |
| **Cross-imports?** | ❌ Không có | ❌ Không có |
| **Tự chạy được?** | ✅ Có `package.json` riêng | ✅ Có `package.json` riêng |

**Risk:** Dev mới nhìn vào → tưởng production → confuse. Cả hai đều isolated, không có import vào `src/`.

### Issue B — Ba bộ i18n JSON thừa ✅ VERIFIED

| Đường dẫn | Files | Dùng thực tế? | Ghi chú |
|---|---|---|---|
| `src/i18n/messages/*.json` | 5 | ✅ **ACTIVE** | Wired vào `next-intl` via `src/i18n/request.ts` |
| `src/messages/*.json` | 5 | ❌ **DEAD** | Zero imports anywhere in codebase |
| `messages/*.json` (root) | 5 | ⚠️ **TEST-ONLY** | Chỉ được import bởi `tests/i18n/smoke.test.ts` |

### Issue C — Mock API routes trong production build ✅ VERIFIED

```
src/app/api/mock/
├── dashboard/route.ts
├── orders/route.ts
├── pricing/features/route.ts
├── projects/route.ts
├── services/route.ts + [slug]/route.ts
├── team/route.ts
└── testimonials/route.ts
```

- **8 files**, zero imports anywhere in `src/`, `FE/`, hoặc `DESIGN LOOPS/`
- Self-import `requireMockApi` từ `@/lib/api/mock-guard` — chỉ chạy khi `NEXT_PUBLIC_MOCK_API_ENABLED=true`
- **100% dead code** — không ai gọi

### Issue D — Ba bộ UI components trùng lắp ✅ VERIFIED (byte-for-byte)

| Location | Count | Hash match |
|---|---|---|
| `src/components/ui/` | **49 files** | ✅ Primary (production) |
| `FE/src/app/components/ui/` | **49 files** | ✅ Identical |
| `DESIGN LOOPS/src/app/components/ui/` | **49 files** | ✅ Identical |

**MD5 `button.tsx`**: `2a2ce95de39f4f4849f70bb615492ab7` — cả 3 location giống hệt nhau.

### Issue E — Admin tab components ✅ VERIFIED

| Location | Count | Ghi chú |
|---|---|---|
| `src/components/admin/` | **3 files** | `AdminSessionInit`, `AdminSidebar`, `AdminTopbar` — wrappers/production shell |
| `FE/src/app/components/admin/` | **26 files** | Full CRUD UIs: MembersTab (1,300L), OrdersTab, AcademyTab, EffectsTab... |
| `DESIGN LOOPS/src/app/components/admin/` | **26 files** | Identical to FE |

Production admin sidebar chỉ là wrapper. Logic CRUD thực sự chỉ tồn tại trong prototype folders.

### Issue F — Thư mục trống ✅ VERIFIED

| Thư mục | Files | Ghi chú |
|---|---|---|
| `src/admin/` | **0** — rỗng hoàn toàn | |
| `src/contexts/` | **0** — rỗng hoàn toàn | |
| `src/scripts/` | **0** — rỗng hoàn toàn | |

### Issue G — Zustand stores ✅ VERIFIED (không phải dead code)

| Store | Production? | Ghi chú |
|---|---|---|
| `authStore.ts` | ✅ **CRITICAL** | 10+ consumers in `src/`, RBAC, auth flow, JWT calls |
| `loopStore.ts` | ✅ **USED** | `OnboardingClient`, `ChatWidget`, `useRealtimeNotifications`, 5+ pages |
| `audioStore.ts` | ✅ **MINOR** | Audio mute cho header/onboarding |

**⚠️ Không phải dead code** — cả ba đều được dùng trong production. `loopStore.ts` chứa 31KB+ hardcoded initial state (orders, portfolio, notifications).

### Issue H — API routes ✅ VERIFIED (không phải vấn đề)

- `api/v1/` = **public read-only** (Sanity, localized, cached) — không có auth
- `api/admin/` = **private full CRUD** (requirePermission)

**Intentional separation.** Không có imports từ FE/DESIGN LOOPS. Không trùng lắp về mặt nghiệp vụ.

### Issue I — Pages ngoài `[locale]` prefix ✅ VERIFIED

```
src/app/customer/page.tsx     → /customer (no locale) — exists but NO links from locale pages
src/app/onboarding/page.tsx   → /onboarding (no locale) — hardcodes redirect to /vi
```

- Zero internal links đến `/customer` hoặc `/onboarding` (không có locale) trong toàn bộ `src/`
- `onboarding/page.tsx` redirect `/vi` hardcoded
- Nếu user truy cập trực tiếp → bypass i18n hoàn toàn

### Issue J — Mock data files ✅ VERIFIED (100% orphaned)

| File | Size | Imports |
|---|---|---|
| `src/data/mockData.ts` | 31,524 bytes | `src/data/teamMockData.ts` (internal only) |
| `src/data/pricingPackages.ts` | 1,715 bytes | Zero imports |
| `src/data/teamMockData.ts` | 5,830 bytes | Zero imports |

- **39KB total, zero production imports**
- `src/data/mockData.ts` chỉ tự re-export `teamMockData.ts`
- Complete dead code

---

## 3. Đề xuất tái cấu trúc

### Phương án: **Structured Cleanup** (Không rewrite lớn)

> Giữ nguyên `FE/` và `DESIGN LOOPS/` nhưng chuẩn hóa, xóa dead code, dọn duplicate.
> - `FE/` và `DESIGN LOOPS/` chứa MembersTab design (1,300L) → giữ để reference
> - Production `src/` đã hoạt động tốt → không rewrite
> - Focus: **loại bỏ confusion** + **dọn dead code**

### Step-by-step

---

#### Step 1: Đánh dấu prototype folders (Safety — Low risk)

**1.1. Thêm `README.md` vào `FE/` và `DESIGN LOOPS/`** (cảnh báo rõ ràng)

**1.2. Cập nhật `CLAUDE.md`** — thêm block cảnh báo ở đầu file:

```
## ⚠️ CRITICAL — Prototype vs Production

/src/                    ✅ PRODUCTION — Next.js 15, đang chạy loops.vn
/FE/                    ⚠️ PROTOTYPE — Vite mock, không dùng trong production
/DESIGN LOOPS/          ⚠️ PROTOTYPE — Design reference, không dùng trong production

KHÔNG BAO GIỜ:
  - Copy/paste code từ FE/ hoặc DESIGN LOOPS/ vào src/
  - Import components từ FE/ hoặc DESIGN LOOPS/ vào src/
  - Dùng mock data files (src/data/*) trong production pages
```

---

#### Step 2: Xóa duplicate i18n JSON (Low risk)

```
XÓA:
  messages/*.json          (root — 5 files, test-only, zero production imports)
  src/messages/*.json      (5 files, DEAD — zero imports anywhere)

GIỮ:
  src/i18n/messages/*.json (5 files — wired vào next-intl, ACTIVE)
```

**Verification trước khi xóa:**
```bash
# Kiểm tra zero imports
grep -r "from.*messages" src/ --include="*.ts" --include="*.tsx" | grep -v "src/i18n/messages"
grep -r "from.*messages" tests/ --include="*.ts" | grep -v "src/i18n/messages"
```

---

#### Step 3: Xóa mock API routes (Medium risk)

```
XÓA:
  src/app/api/mock/ (8 files, zero imports, dead code)

GIỮ:
  src/app/api/admin/    (real admin CRUD, permission-gated)
  src/app/api/academy/  (real academy API)
  src/app/api/v1/       (public read-only, localized)
  src/app/api/auth/     (auth API)
  src/app/api/public/   (public endpoints)
```

**Verification:** `grep -r "api/mock" src/` → expected: zero results ✅

---

#### Step 4: Xóa mock data files (Medium risk)

```
XÓA:
  src/data/mockData.ts          (31,524 bytes — zero production imports)
  src/data/pricingPackages.ts    (1,715 bytes — zero imports)
  src/data/teamMockData.ts      (5,830 bytes — zero imports)
```

**⚠️ Lưu ý:** `loopStore.ts` có thể chứa các cấu trúc tương tự mockData (orders, portfolio, services) nhưng inline trong code — KHÔNG xóa `loopStore.ts`.

**Verification:**
```bash
grep -r "from.*data/mockData\|from.*data/teamMockData\|from.*data/pricingPackages" \
  src/ --include="*.ts" --include="*.tsx"
# → expected: zero results ✅
```

---

#### Step 5: Xóa thư mục trống (Low risk)

```
XÓA:
  src/admin/      (0 files)
  src/contexts/   (0 files)
  src/scripts/    (0 files)
```

---

#### Step 6: Fix locale routing `/customer` và `/onboarding` (Low risk)

```
XÓA:
  src/app/customer/page.tsx     (/customer — bypasses i18n)
  src/app/onboarding/page.tsx    (/onboarding — hardcodes /vi redirect)

GIỮ:
  src/app/[locale]/khach-hang/page.tsx  → /{locale}/khach-hang ✅
  src/app/[locale]/onboarding/page.tsx   → /{locale}/onboarding ✅
```

**Verification:**
```bash
# Kiểm tra không có link nào đến /customer hoặc /onboarding (no locale)
grep -rn "/customer" src/ | grep -v "\[locale\]"
grep -rn "/onboarding" src/ | grep -v "\[locale\]"
```

**⚠️ Trước khi xóa:** Kiểm tra xem FE/ hoặc DESIGN LOOPS/ có hardcoded link đến `/customer` hoặc `/onboarding` không.

---

#### Step 7: Hợp nhất Zustand stores — CLEANUP (Medium risk)

> ⚠️ **Stores không phải dead code** — cả 3 đều được dùng. Chỉ cleanup unused data.

**Audit trước:** Với mỗi store, xác định fields/data nào KHÔNG được import bởi bất kỳ consumer nào.

```
src/app/store/loopStore.ts
  → INIT_PORTFOLIO (6 items, 31KB+) — xem có consumer nào dùng không
  → INIT_ORDERS, INIT_ADMIN_NOTIFS, INIT_CLIENT_NOTIFS — xem consumer
  → Nếu zero consumers → có thể xóa hoặc đánh dấu DEAD_DATA

src/app/store/authStore.ts
  → INIT_QUESTS, INIT_EVENTS — xem có consumer nào
  → Quest/CompanyEvent interfaces — chỉ type, không có data
  → Nếu zero consumers → đánh dấu

MỤC TIÊU: Giảm bundle size bằng cách loại bỏ unused initial state.
```

---

#### Step 8: Archive prototypes (Tùy chọn)

**Option A — Keep as-is (Recommended):** Giữ nguyên, thêm cảnh báo (Step 1). MembersTab design quý giá.

**Option B — Archive to git branch:**
```bash
git checkout -b archive/prototypes
git mv FE/ FE-ARCHIVE/
git mv "DESIGN LOOPS/" DESIGN-LOOPS-ARCHIVE/
git commit -m "chore: archive prototype folders"
git checkout main
```

**Option C — Move to separate repo:** Tạo repo `loop-design-reference/` riêng.

---

## 4. Thứ tự thực hiện đề xuất

| Step | Task | Risk | Effort | Pre-check |
|------|------|------|--------|-----------|
| **1** | README + CLAUDE.md cảnh báo | Thấp | 30 phút | — |
| **2** | Xóa duplicate i18n JSON | Thấp | 15 phút | grep import |
| **3** | Xóa mock API routes | Trung bình | 30 phút | grep api/mock |
| **4** | Xóa mock data files | Trung bình | 30 phút | grep data/ imports |
| **5** | Xóa thư mục trống | Thấp | 5 phút | xác nhận empty |
| **6** | Fix locale routing | Thấp | 1 giờ | grep /customer, /onboarding |
| **7** | Cleanup Zustand stores | Trung bình | 2 giờ | audit consumers |
| **8** | Archive prototypes | Thấp | 1 giờ | tùy chọn |

**Steps 2–6: Hoàn toàn reversible qua git.** Step 7 cần audit trước.

---

## 5. Non-goals (Không làm)

- ❌ Không rewrite production pages
- ❌ Không merge `FE/` hoặc `DESIGN LOOPS/` vào `src/`
- ❌ Không thay đổi business logic trong `src/lib/`
- ❌ Không xóa `src/app/store/` (stores có consumers thực)
- ❌ Không xóa `src/app/api/v1/` (public API, intentional)
- ❌ Không xóa git history

---

## 6. Rollback Plan

```bash
# Reversible via git (Steps 2-6):
git log --oneline -3
git reset --hard HEAD~1   # undo last commit
git reflog                 # recover any commit

# Step 7 (stores): requires case-by-case recovery
```

## 7. Cấu trúc mục tiêu

```
d:/LOOP_COMPANY/LOOP/
├── src/                      # ✅ PRODUCTION — Next.js 15
│   ├── app/
│   │   ├── [locale]/         # Public pages (/{locale}/...) — DUY NHẤT
│   │   ├── admin/             # Admin dashboard
│   │   └── api/
│   │       ├── v1/           # Public read-only (localized)
│   │       ├── admin/        # Protected CRUD
│   │       ├── academy/       # Education API
│   │       ├── auth/          # Auth
│   │       └── public/        # Public
│   ├── components/
│   │   ├── ui/               # Shadcn/ui — DUY NHẤT (49 files)
│   │   ├── admin/            # Admin shell (3 files)
│   │   ├── layout/           # Shared layout
│   │   └── landing/          # Page client components
│   ├── lib/                  # Business logic
│   ├── i18n/messages/        # ✅ i18n JSON DUY NHẤT (5 locales)
│   ├── store/                # Zustand stores (3 files — PRODUCTION)
│   ├── styles/               # globals.css, figma-theme.css
│   ├── types/
│   └── middleware.ts
├── prisma/                   # Schema + seed
├── docs/                     # Documentation
├── public/                   # Static assets
├── FE/                       # ⚠️ PROTOTYPE — reference only
├── DESIGN LOOPS/             # ⚠️ PROTOTYPE — reference only
└── .claude/                  # Claude Code rules
```
