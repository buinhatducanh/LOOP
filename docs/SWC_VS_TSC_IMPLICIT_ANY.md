# SWC vs TSC — Implicit `any` Gap Analysis

> **Ngày**: 2026-05-12
> **Vấn đề**: `tsc --noEmit` pass 0 errors nhưng Vercel SWC build vẫn fail với `implicit any` trên 30+ lần push
> **Trạng thái**: ĐÃ PHÂN TÍCH — ĐANG KHẮC PHỤC

---

## 1. Root Cause

### 1.1 Hai compiler khác nhau

| | `tsc --noEmit` | SWC (Vercel Next.js) |
|---|---|---|
| **Engine** | Microsoft TypeScript | swc (Rust-based) |
| **Config** | `tsconfig.json` | `next.config.js` + SWC defaults |
| **`skipLibCheck`** | `true` → bỏ qua lib errors | Không có effect |
| **Strict mode** | Theo `tsconfig.json` | SWC defaults (strict function types) |
| **Implicit any trong callback** | TSC có thể infer từ generic context | **SWC strict hơn, REJECTS nhiều trường hợp TSC chấp nhận** |

### 1.2 Tại sao TSC bỏ qua nhưng SWC không

**Case A — Module-level mutable variable:**
```typescript
// TSC: `_cache` is `Array | null` — narrowed to `Array` after assignment? NO.
// TSC narrows correctly in simple cases, but SWC is conservative.
let _cache: DepartmentRecord[] | null = null;
_cache = departments.map((d) => ({ ... }));
return _cache; // TSC: "null not assignable to DepartmentRecord[]"
```
→ **Fix**: `return _cache!;` hoặc type guard

**Case B — Prisma query result inference:**
```typescript
// TSC: Prisma client infers return type from select clause → `findMany()` returns array
// SWC: Conservative inference, treats callback param as implicit any
const tasks = await prisma.task.findMany({ ... });
const done = tasks.filter((t) => t.status === "done");
//                                    ^^^ SWC: "Parameter 't' implicitly has 'any' type"
```
→ **Fix**: `(t: { status: string }) =>`

**Case C — `$transaction` callback:**
```typescript
// TSC: infers `tx` from `$transaction` generic overload
// SWC: Cannot infer `tx` type → implicit any
await prisma.$transaction(async (tx) => { ... });
//                                  ^^^ SWC: "Parameter 'tx' implicitly has 'any' type"
```
→ **Fix**: `(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0])`

**Case D — `Promise.all` destructuring:**
```typescript
// TSC: Can infer both elements from Prisma query types
// SWC: Loses type info through destructuring
const [awards, tasks] = await Promise.all([
  prisma.lpAward.findMany({ where: { status: "approved" } }),
  prisma.task.findMany({ where: { completedAt: { gte: startOfMonth } } }),
]);
const done = tasks.filter((t) => t.status === "done");
//                                    ^^^ SWC: implicit any on `t`
```
→ **Fix**: `(t: { status: string }) =>`

**Case E — Untyped API response + fallback:**
```typescript
// TSC: Inferences `unknown[]` from `?? []`, then `any` through operations
// SWC: Marks callback param as implicit any on untyped/unknown arrays
const features = (data?.features ?? []) as unknown[];
const selected = features.filter((f) => f.id === selectedId);
//                                    ^^^ SWC: implicit any on `f`
```
→ **Fix**: `(f: { id: string }) =>` hoặc dùng typed interface

**Case F — `tsconfig.json` `skipLibCheck: true`:**
```json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```
`skipLibCheck` chỉ bỏ qua `.d.ts` files (node_modules/@types, Prisma client types). Nó **KHÔNG** affect implicit any detection trong source code. Đây là hiểu lầm phổ biến.

### 1.3 `tsc --noEmit` không đủ — Proof

```bash
# TSC: pass hoàn toàn
$ npx tsc --noEmit
# (no output = 0 errors)

# SWC: fail với 5+ lỗi
$ npm run build
Failed to compile.
./src/lib/jobs/functions.ts:326:42
Type error: Parameter 't' implicitly has an 'any' type.
```

---

## 2. Giải pháp triệt để

### 2.1 Ngắn hạn: Pre-push hook (ĐÃ LÀM)

File: `.husky/pre-push`

```sh
#!/bin/sh
npm run build > /tmp/loop-build.log 2>&1
RESULT=$?
if [ $RESULT -eq 0 ]; then
  echo "✅ Build passed — safe to push"
  exit 0
fi
# Parse TypeScript/SWC errors từ log
grep -E "^./.*Type error" /tmp/loop-build.log | head -20
exit 1
```

**Ưu điểm:**
- Catch lỗi LOCAL trước push
- Build local ~1-2 phút thay vì 3+ phút Vercel
- Không tốn tiền Vercel mỗi lần fix thử

### 2.2 Dài hạn: Bật `noImplicitAny` + Fix triệt để

**Thêm vào `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

**Hoặc thêm vào mỗi file cụ thể:**
```typescript
// @ts-strict
// eslint-disable-next-line @typescript-eslint/no-explicit-any
```

### 2.3 Công thức fix các pattern phổ biến

| Pattern | Fix | Ví dụ |
|---------|-----|--------|
| `$transaction(async (tx) =>` | `(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) =>` | `functions.ts:217` |
| `array.filter((item) =>` trên Prisma result | `(item: { field: string }) =>` | `functions.ts:326` |
| `array.reduce((acc, item) =>` không có accumulator type | `((acc: number, item: { n: number }) => acc + item.n, 0)` | |
| `_cache` null return | `return _cache!;` | `departments.ts:71` |
| `Promise.all` destructuring + callback | Thêm explicit type trên callback param | |

---

## 3. Toàn bộ lỗi đã fix (30+ lần push)

| Lần | File | Pattern | Ngày |
|-----|------|---------|------|
| 1 | `src/lib/analytics/server.ts` | `.map((r) =>` — 7 callbacks | 2026-05 |
| 2 | `src/lib/analytics/aggregations.ts` | `$queryRaw` row callbacks | 2026-05 |
| 3 | `src/lib/auth/permissions.ts` | `flatMap`, `map` callbacks | 2026-05 |
| 4 | `src/lib/auth/session.ts` | `map` callbacks + `lastUsedAt: Date \| null` | 2026-05 |
| 5 | `src/lib/departments.ts` | `departments.map`, `members.map` | 2026-05 |
| 6 | `src/lib/pricing/domain-search/route.ts` | `dbPrices` type | 2026-05 |
| 7 | `src/auth.ts` | `$transaction` callback | 2026-05 |
| 8 | `src/app/api/v1/courses/route.ts` | `courses.map` | 2026-05 |
| 9 | `src/app/api/v1/courses/[id]/route.ts` | `findIndex` callback | 2026-05 |
| 10 | `src/lib/jobs/functions.ts` | 2× `$transaction` callbacks | 2026-05 |
| 11 | `src/lib/pricing/quote-to-order.ts` | `$transaction` callback | 2026-05 |
| 12 | `src/lib/pricing/order-lifecycle.ts` | 2× `$transaction` callbacks | 2026-05 |
| 13 | `src/lib/services/commerce/invoice.service.ts` | `$transaction` callback | 2026-05 |
| 14 | `src/lib/services/commerce/commission.service.ts` | 3× `$transaction` callbacks | 2026-05 |
| 15 | `src/lib/services/customer/referral.service.ts` | 2× `$transaction` callbacks | 2026-05 |
| 16 | `src/lib/services/customer/lp.service.ts` | 2× `$transaction` callbacks | 2026-05 |
| 17 | `src/lib/services/gamification/redemption.service.ts` | `$transaction` callback | 2026-05 |
| 18 | `src/lib/services/gamification/customer-lp.service.ts` | 2× `$transaction` callbacks | 2026-05 |
| 19 | `src/lib/services/gamification/transfer.service.ts` | `$transaction` callback | 2026-05 |
| 20 | `src/lib/jobs/functions.ts` | 2× `.filter((t) =>` callbacks | 2026-05 |

**Total: 19 commits, ~35 implicit any fixes, 30+ Vercel build attempts**

---

## 4. Còn lại — Các file có risk cao

### 4.1 Cần verify và fix thêm (từ SWC sweep)

| File | Line(s) | Risk | Pattern |
|------|---------|------|---------|
| `src/app/admin/quotation/page.tsx` | 146,149,156,217,1121,1129,1146 | **HIGH** | `.map((h: any))`, `.filter((d: any))` |
| `src/app/admin/orders/page.tsx` | 1308-1309 | **HIGH** | `.map((f: any))`, `.map(a =>)` |
| `src/app/admin/lp/page.tsx` | 97,100,103,104 | **HIGH** | `.filter((a))`, `.reduce((s, t))` |
| `src/components/landing/BookingWizardClient.tsx` | 824,1103,1119 | **HIGH** | `.filter(f =>)`, `.map(pkg =>)` |
| `src/components/landing/WebPurchaseWizard.tsx` | 244,264,273 | **HIGH** | `.find((d) =>)`, `.reduce((s, d) =>)` |
| `src/components/ui/ChatWidget.tsx` | 29-30 | **HIGH** | `.reduce((s, o) =>)`, `.filter(m =>)` |
| `src/app/admin/media/page.tsx` | 232,776 | **MEDIUM** | `.map((ns) =>)`, `.filter((a) =>)` |
| `src/app/admin/analytics/page.tsx` | 217,275,440 | **MEDIUM** | `.reduce((s, v) =>)`, `.reduce((s, m) =>)` |

> **Lưu ý**: Các file `.tsx` trong `components/` và `app/` — SWC chỉ check khi Vercel build. Local `tsc --noEmit` có thể pass. Cần chạy `npm run build` local để xác nhận.

### 4.2 Hành động cần làm

1. **Bước 1**: Chạy `npm run build` local mỗi lần trước khi commit (hook đã làm)
2. **Bước 2**: Nếu Vercel vẫn fail sau khi TSC pass → check file list ở section 4.1
3. **Bước 3**: Fix bằng pattern ở section 2.3
4. **Bước 4**: Commit → push → verify Vercel pass

---

## 5. Kết luận

**Vấn đề cốt lõi**: `tsc --noEmit` với `skipLibCheck: true` không phải "golden standard" cho SWC compatibility. SWC là stricter compiler — nó sẽ luôn bắt thêm lỗi mà TSC bỏ qua.

**Giải pháp hiện tại**:
- ✅ Pre-push hook (`.husky/pre-push`) — chặn fail trước khi push
- ✅ Hook clean `.next/` cache — tránh Windows ENOENT false positive
- ✅ Hook parse SWC error format — hiện đúng dòng bị lỗi

**Giải pháp dài hạn**:
- Bật `noImplicitAny: true` trong `tsconfig.json` để TSC và SWC align
- Hoặc dùng `tsc --noEmit` (không có `skipLibCheck`) như pre-commit check
- Hoặc dùng `swc --tsc-config tsconfig.json` để chạy SWC type-check local

**Nguyên tắc từ nay**:
```
git commit → pre-push hook → npm run build → PASS → git push
                                      → FAIL → fix → commit → retry
```
