# LOOP Solutions — Quy Tắc Phát Triển

> **Đọc PROJECT-PLAN.md trước. File này là quick-reference cho quy tắc cụ thể.**
> Tuân thủ tuyệt đối. Vi phạm = reject code.

---

## RULES

### R1 — Cấm Hardcode

```typescript
// ❌ VI PHẠM — reject
const url = "https://loop.vn";
const name = "VNRetail JSC";
const price = 350_000_000;
const color = "#3B82F6";

// ✅ TUÂN THỦ
import { DS } from "@/lib/design-tokens";
const url = process.env.NEXT_PUBLIC_SITE_URL;
const name = dbClient.name; // từ Prisma query
const color = DS.blue;
```

### R2 — Design Tokens Bắt Buộc

Mọi inline style cho màu sắc, background, border phải dùng `DS`, `GRD`, `GLOW`.

```typescript
// ❌ VI PHẠM
style={{ color: "#3B82F6", background: "#0F172A", border: "1px solid #1F2937" }}

// ✅ TUÂN THỦ
style={{ color: DS.blue, background: DS.bgCard, border: `1px solid ${DS.border}` }}
```

### R3 — Business Data → API/DB

Business data (orders, members, services, portfolio) phải đến từ:
1. React Query (gọi API route)
2. Trực tiếp Prisma (server components)

```typescript
// ❌ VI PHẠM — hardcoded mock data
const orders = [{ id: 'ORD-2601', clientName: 'Nguyễn Minh Tuấn', ... }];
const portfolio = [{ id: '1', title: 'VNRetail Platform', ... }];

// ✅ TUÂN THỦ — từ API
const { data } = useQuery({
  queryKey: qk.orders({ page: 1 }),
  queryFn: () => adminApi.get("/api/admin/orders"),
});
```

### R4 — Mỗi Trang = Route File Riêng

```typescript
// ❌ VI PHẠM — gộp nhiều pages vào 1 file
// src/app/admin/page.tsx — KHÔNG gộp overview + orders + members

// ✅ TUÂN THỦ
src/app/admin/overview/page.tsx    // 1 file = 1 route
src/app/admin/orders/page.tsx
src/app/admin/members/page.tsx
```

### R5 — i18n Cho Mọi User-Facing Text

```typescript
// ❌ VI PHẠM
<h1>Chào mừng đến với LOOP Solutions</h1>
<span>Đang tải...</span>

// ✅ TUÂN THỦ
<h1>{t("welcome")}</h1>
<span>{t("loading")}</span>
```

### R6 — Query Keys Qua `qk` Factory

```typescript
// ❌ VI PHẠM
queryKey: ["orders", page, limit]
queryKey: `admin-services-${id}`

// ✅ TUÂN THỦ
queryKey: qk.orders({ page, limit })
queryKey: qk.service(id)
```

### R7 — API Client Đúng

```typescript
// Public (không auth)
import { apiClient } from "@/lib/api/client";
apiClient.get("/api/services");

// Admin (có auth)
import { adminApi } from "@/lib/api/client";
adminApi.post("/api/admin/services", payload);
```

### R8 — KHÔNG Thao Tác DESIGN LOOPS

```bash
# ❌ VI PHẠM — KHÔNG BAO GIỜ làm điều này
# Tạo file trong DESIGN LOOPS/
# Sửa file trong DESIGN LOOPS/
# Xóa file trong DESIGN LOOPS/

# ✅ TUÂN THỦ — chỉ đọc để reference
# Mở file trong DESIGN LOOPS/ để xem UI mẫu
# Không sửa gì trong đó
```

### R9 — Auth Store — Không Rollback

```typescript
// ❌ VI PHẠM — quay lại mock users
const DEMO_USERS = { admin: { name: 'Akira Sato', ... } };

// ✅ TUÂN THỦ — đã migrate, dùng real API
const { user } = useAuthStore();
await useAuthStore.getState().login(email, password);
```

### R10 — Store Chỉ Cho UI State

```typescript
// ❌ VI PHẠM — business data trong Zustand store
export const useLoopStore = create((set) => ({
  orders: [...],
  portfolio: [...],
  members: [...],
}));

// ✅ TUÂN THỦ — store chỉ cho UI
export const useUIStore = create((set) => ({
  sidebarOpen: true,
  activeModal: null,
  toasts: [],
}));
```

### R11 — Comment Mô Tả Logic Phức Tạp

```typescript
// ✅ TUÂN THỦ — có comment cho logic phức tạp
// Chuyển order sang status tiếp theo trong flow
// pending → paid → in_progress → demo_ready → client_review → done
const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(currentStatus) + 1];

// ❌ VI PHẠM — không comment cho logic không rõ ràng
const next = flow[flow.indexOf(s) + 1];
```

### R12 — Error Handling Bắt Buộc

```typescript
// ❌ VI PHẠM — không handle error
const { data } = useQuery({ queryKey, queryFn: () => api.get("/x") });

// ✅ TUÂN THỦ — có error state
const { data, isLoading, isError, error } = useQuery({
  queryKey, queryFn,
});
if (isError) return <ErrorState message={error.message} />;
```

### R13 — Empty State Bắt Buộc

```typescript
// ❌ VI PHẠM — không có empty state
{orders.map(o => <OrderRow key={o.id} order={o} />)}

// ✅ TUÂN THỦ — có empty state
{orders.length === 0 ? (
  <EmptyState message={t("emptyOrders")} />
) : (
  orders.map(o => <OrderRow key={o.id} order={o} />)
)}
```

### R14 — Responsive Mobile-First

```typescript
// ✅ TUÂN THỦ — responsive grid
style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}

// ✅ TUÂN THỦ — responsive font
style={{ fontSize: "clamp(1rem, 2.5vw, 1.5rem)" }}
```

### R15 — No Console.log Trong Production Code

```typescript
// ❌ VI PHẠM — console.log
console.log("DEBUG:", data);
console.error("Error:", err);

// ✅ TUÂN THỦ — dùng logger
import { logger } from "@/lib/logger";
logger.info("Fetching orders", { page, limit });
logger.error("Failed to fetch orders", { error: err });
```

### R16 — Commit Messages Chuẩn

```
feat(orders): add pagination to order list page
fix(portfolio): correct image URL fallback
refactor(services): move hardcoded prices to DB
docs: update PROJECT-PLAN with new tab structure
seed: add 27 team members to database
```

### R17 — CSS Custom Properties Cho Animation

```typescript
// ✅ TUÂN THỦ — animation values từ constants
transition={{ duration: 0.4, ease: "easeOut" }}

// ❌ VI PHẠM — magic numbers không rõ ý nghĩa
transition={{ duration: 0.372 }}
```

---

## QUY TRÌNH KHI NHẬN TASK MỚI

### Bước 1: Đọc PROJECT-PLAN.md

```
1. Xác định task thuộc giai đoạn nào (1-8)
2. Xác định trang/route cụ thể
3. Xác định data source (model nào?)
4. Xác định API route đã có chưa
```

### Bước 2: So Sánh Với DESIGN LOOPS

```
1. Tìm file UI tương tự trong DESIGN LOOPS/src/app/pages/
2. Copy cấu trúc layout, animations, interactions
3. KHÔNG copy data — thay bằng API calls
```

### Bước 3: Code Theo Cấu Trúc

```
1. Tạo route file (src/app/[locale]/page-name/page.tsx)
2. Import design tokens từ @/lib/design-tokens
3. Import i18n từ useTranslations
4. Import API client từ @/lib/api/client
5. Import query keys từ @/lib/query/provider
6. Code loading → data → empty/error → content
```

### Bước 4: Self-Review

```
□ Hardcode checklist (phần 8 trong PROJECT-PLAN)
□ Design tokens dùng đúng
□ i18n keys đầy đủ
□ Loading/empty/error states
□ No console.log
□ No TypeScript errors
□ No ESLint errors
```

### Bước 5: Commit

```
git add src/app/[locale]/[page]/page.tsx
git commit -m "[TYPE](scope): description"
```

---

## VI PHẠM = REJECT

> Nếu code vi phạm bất kỳ rule nào ở trên:
> 1. Code sẽ bị reject
> 2. Phải sửa lại theo rules trước khi merge
> 3. Không có ngoại lệ — "tôi sẽ sửa sau" = reject

---

## CÁC NGUỒN THAM KHẢO

| File | Mục đích |
|------|---------|
| `docs/PROJECT-PLAN.md` | Kế hoạch tổng thể + kiến trúc |
| `docs/PROJECT-RULES.md` | Quick reference quy tắc (file này) |
| `prisma/schema.prisma` | Database models — nguồn sự thật |
| `src/lib/design-tokens.ts` | Design tokens — nguồn sự thật |
| `src/lib/api/client.ts` | API client methods |
| `src/lib/query/provider.tsx` | Query keys factory |
| `src/app/store/authStore.ts` | Auth state + RBAC |
| `src/messages/vi.json` | i18n Vietnamese keys |
| `DESIGN LOOPS/src/app/pages/` | UI/UX reference (đọc thôi) |

---

## LIÊN HỆ KHI CÓ THẮC MẮC

Nếu có trường hợp không nằm trong rules:
1. Đọc lại PROJECT-PLAN.md
2. Đọc lại file này
3. Nếu vẫn không rõ → hỏi trước khi code
