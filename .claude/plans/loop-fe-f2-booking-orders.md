# Phase F2 Plan: Booking Wizard + Orders

**Created:** 2026-03-29
**Phase:** F2 — Booking Wizard + Order Lifecycle
**Status:** Draft — awaiting approval

---

## 1. Current State Snapshot

### What exists today

**FE (`d:/LOOP_COMPANY/LOOP/FE/`):**
- `src/app/pages/BookingWizardPage.tsx` — 8-step wizard UI hoàn chỉnh
  - Step 1: Chọn dịch vụ (4 loại: Web/App/Dashboard/SEO)
  - Step 2: Chọn gói (Starter/Business/Enterprise × multiplier)
  - Step 3: Tính năng tùy chọn (add-on checklist)
  - Step 4: Nhân sự phụ trách
  - Step 5: Lịch hẹn tương tác
  - Step 6: Dịch vụ thêm (hosting, bảo trì...)
  - Step 7: Review đơn hàng
  - Step 8: Thanh toán (VNĐ + LP discount ≤20%)
- `src/app/pages/AdminDashboard.tsx` — có `OrdersTab` (inline trong dashboard)
- `src/app/store/loopStore.ts` — `INIT_ORDERS`, `INIT_SERVICES`, `INIT_PORTFOLIO` mock data
- `src/api/services.service.ts` — đã wired BE `/api/v1/services`
- `src/api/client.ts` — fetch wrapper với retry + idempotency

**BE (`d:/LOOP_COMPANY/LOOP/`):**
- `/api/admin/orders/route.ts` — GET list, POST create
- `/api/admin/orders/[id]/route.ts` — GET/PUT single order
- `/api/admin/services/route.ts` — CRUD services
- `/api/admin/packages/route.ts` — service packages
- `/api/admin/features/route.ts` — features
- `/api/admin/addon-services/route.ts` — extras
- `/api/v1/services/route.ts` — public service list (wired)
- `/api/v1/pricing/route.ts` — public pricing config
- **MISSING:** Quote submission endpoint, LP redemption integration, order transition endpoint

### Key gaps to fill

| Gap | Impact | Owner |
|-----|--------|-------|
| No `POST /api/quote` endpoint | Wizard can't submit | BE |
| No order status transition endpoint | Admin can't advance pipeline | BE |
| FE BookingWizardPage still uses hard-coded `PACKAGES` array | Wizard data is static | FE |
| FE Admin OrdersTab inline — not a standalone tab component | Can't navigate to orders from sidebar | FE |
| LP discount calculation not wired | Discount slider doesn't call BE | FE |
| Demo URL send not wired | Admin can't send demo links | FE/BE |

---

## 2. Goal

Wizard 8 bước → tạo Quote/Order thật trong DB → Admin thấy order → advance được status → khách hàng xem trong CustomerDashboard.

---

## 3. Scope

### 3.1 i18n 5 ngôn ngữ — bắt buộc áp dụng trong F2

Theo `fe-i18n-implementation-plan.md`, mọi flow mới phải tương thích 5 locale: `vi/en/ja/ko/zh`.

**F2 i18n requirements:**
1. **Pricing config endpoint** hỗ trợ `?lang=` (ít nhất cho label fields) hoặc trả đủ multilingual fields để FE map theo locale hiện tại.
2. **Booking Wizard UI strings** không hard-code thêm text mới ngoài message files hiện có.
3. **Order status labels** map theo locale ở FE (data status code giữ invariant từ BE).
4. **Fallback policy:** nếu locale field thiếu → fallback về `vi`.
5. **QA smoke tối thiểu:** `/vi`, `/en`, `/ja`, `/ko`, `/zh` đều đi qua được flow Wizard Step 1→8 (không crash, không key thiếu).

### P0 — Wizard core (8 bước → Quote → Order)

**(i18n note):** dữ liệu hiển thị trong Step 1/2/3/6 cần ưu tiên field theo locale hiện tại, fallback `vi`.

**FE tasks:**
1. Tạo `src/api/booking.service.ts` — pricing config, calculate, submit quote
2. Wiring Wizard Step 1–6: thay hard-coded data → gọi `GET /api/pricing/config`
3. Wiring Wizard Step 7 (review): hiển thị breakdown từ calculation response
4. Wiring Wizard Step 8 (payment): LP discount ≤20%, `1000 LP = 500,000 VND`
5. Submit wizard → `POST /api/quote` → tạo Order
6. Success screen: hiển thị order ID, redirect options

**BE tasks:**
1. `POST /api/quote` — validate wizard payload → create Order (status: `pending_payment`)
2. `GET /api/pricing/config` — trả services/packages/features/addons cho wizard
3. **i18n support:** `GET /api/pricing/config?lang=vi|en|ja|ko|zh` (hoặc trả đa field + FE chọn theo locale)

### P1 — Admin Order Management

**(i18n note):** admin labels có thể giữ VI nội bộ, nhưng dữ liệu content gửi cho customer (message/demo note templates) cần locale-aware nếu có customer locale.

**FE tasks:**
1. Tách `OrdersTab.tsx` từ inline trong AdminDashboard → standalone component
2. Admin OrdersTab: list orders + filter (status, date, customer)
3. Order detail panel: view full order breakdown
4. Status transition buttons: `pending_payment → paid → in_progress → demo_ready → client_review → done`
5. Send demo: `POST /api/admin/orders/[id]/demo` → masked URL → customer notification

**BE tasks:**
1. `POST /api/admin/orders/[id]/transition` — advance status với validation
2. `POST /api/admin/orders/[id]/demo` — generate masked demo URL
3. Order list: pagination + filter support

### P2 — Customer Dashboard Orders

**(i18n note):** customer-facing status text, timeline notes, invoice labels cần bám locale hiện tại.

**FE tasks:**
1. CustomerDashboard orders tab: list customer's orders
2. Order status timeline view
3. Demo viewer link (masked URL)
4. LP reward display per order
5. Locale map cho order status labels (`vi/en/ja/ko/zh`)

### 3.2 F2 i18n Exit Criteria

- [ ] Wizard data endpoint trả dữ liệu locale-aware hoặc đủ multilingual fields.
- [ ] 5 locale routes (`/vi|en|ja|ko|zh`) render Wizard không lỗi key.
- [ ] Order status labels ở customer side hiển thị đúng locale.
- [ ] Fallback `vi` hoạt động khi thiếu translation field.
- [ ] Không thêm hard-coded string mới ngoài hệ message hiện hành.

---

### P0 — Wizard core (8 bước → Quote → Order)

**FE tasks:**
1. Tạo `src/api/booking.service.ts` — pricing config, calculate, submit quote
2. Wiring Wizard Step 1–6: thay hard-coded data → gọi `GET /api/pricing/config`
3. Wiring Wizard Step 7 (review): hiển thị breakdown từ calculation response
4. Wiring Wizard Step 8 (payment): LP discount ≤20%, `1000 LP = 500,000 VND`
5. Submit wizard → `POST /api/quote` → tạo Order
6. Success screen: hiển thị order ID, redirect options

**BE tasks:**
1. `POST /api/quote` — validate wizard payload → create Order (status: `pending_payment`)
2. `GET /api/pricing/config` — trả services/packages/features/addons cho wizard

### P1 — Admin Order Management

**FE tasks:**
1. Tách `OrdersTab.tsx` từ inline trong AdminDashboard → standalone component
2. Admin OrdersTab: list orders + filter (status, date, customer)
3. Order detail panel: view full order breakdown
4. Status transition buttons: `pending_payment → paid → in_progress → demo_ready → client_review → done`
5. Send demo: `POST /api/admin/orders/[id]/demo` → masked URL → customer notification

**BE tasks:**
1. `POST /api/admin/orders/[id]/transition` — advance status với validation
2. `POST /api/admin/orders/[id]/demo` — generate masked demo URL
3. Order list: pagination + filter support

### P2 — Customer Dashboard Orders

**FE tasks:**
1. CustomerDashboard orders tab: list customer's orders
2. Order status timeline view
3. Demo viewer link (masked URL)
4. LP reward display per order

---

## 4. Step-by-Step Implementation

### Step 1 — BE: Pricing Config + Quote Endpoint

### Clarified Constraints (from planning questions)

- **Step 6 Addons UI:** Đã có trong `BookingWizardPage.tsx` — chỉ cần wire data, không cần tạo mới.
- **LP balance source:** Dùng `authStore.lpBalance` (local state, đã có sau login) — không cần gọi BE mỗi lần.
- **BE vs FE sequencing:** **BE tạo endpoints trước** (`pricing/config` + `/quote` + transition), sau đó FE wire. Không có mock leak — FE chờ BE contract.

### Step 1 — BE: Pricing Config + Quote Endpoint

**Owner: BE**

**`GET /api/pricing/config`** — trả toàn bộ wizard data:
```json
{
  "data": {
    "services": [{ "id": "...", "name": "Thiết kế Web", "slug": "...", "basePrice": 15000000 }],
    "packages": [
      { "id": "starter", "name": "Starter", "multiplier": 1.0, "description": "..." },
      { "id": "business", "name": "Business", "multiplier": 2.2, "description": "..." },
      { "id": "enterprise", "name": "Enterprise", "multiplier": 3.8, "description": "..." }
    ],
    "features": [{ "id": "...", "name": "...", "price": 2000000, "category": "..." }],
    "addons": [{ "id": "...", "name": "...", "price": 500000, "perMonth": true }],
    "lpRate": { "lpPerVnd": 500000, "maxDiscount": 0.20 }
  }
}
```

**`POST /api/quote`** — nhận wizard payload → tạo Order:
```json
// Request
{
  "serviceId": "...",
  "packageId": "starter|business|enterprise",
  "selectedFeatures": ["feature-id-1", "feature-id-2"],
  "selectedAddons": ["addon-id-1"],
  "staffAssignment": "member-id|null",
  "scheduledDate": "2026-04-15T09:00:00Z",
  "customerInfo": { "name": "...", "email": "...", "phone": "..." },
  "lpToRedeem": 0,
  "notes": "..."
}

// Response
{ "data": { "orderId": "...", "status": "pending_payment", "total": 18500000, "lpDiscount": 0 } }
```

**Validation rules:**
- `lpToRedeem * 500000 <= total * 0.20` (max 20% discount)
- `scheduledDate` must be future
- At least 1 service selected

### Step 2 — FE: Booking Service Layer

**Owner: FE**

**`src/api/booking.service.ts`:**
```typescript
export interface PricingConfig {
  services: WizardService[];
  packages: ServicePackage[];
  features: Feature[];
  addons: AddonService[];
  lpRate: { lpPerVnd: number; maxDiscount: number };
}

export interface QuoteRequest {
  serviceId: string;
  packageId: string;
  selectedFeatures: string[];
  selectedAddons: string[];
  staffAssignment: string | null;
  scheduledDate: string;
  customerInfo: { name: string; email: string; phone: string };
  lpToRedeem: number;
  notes: string;
}

export const bookingService = {
  getPricingConfig: () => api.get<PricingConfig>('/pricing/config'),
  calculateQuote: (req: Partial<QuoteRequest>) =>
    api.post<{ total: number; lpDiscount: number; breakdown: PriceBreakdown }>('/pricing/calculate', req),
  submitQuote: (req: QuoteRequest) =>
    api.post<{ orderId: string; status: string; total: number }>('/quote', req),
};
```

### Step 3 — FE: Wire Wizard Steps 1–6

**Owner: FE**

**Step 1 (Service):**
- `GET /api/pricing/config` → render 4 service cards
- Click → set `selectedService`, advance to Step 2

**Step 2 (Package):**
- 3 package options (Starter/Business/Enterprise)
- Show price: `service.basePrice × package.multiplier`
- Highlight recommended

**Step 3 (Features):**
- Group features by category (UI/Backend/SEO/...)
- Multi-select checklist
- Running total updates in real-time

**Step 4 (Staff):**
- `GET /api/v1/team` → show available team members
- Optional — can skip

**Step 5 (Schedule):**
- Date picker (min: tomorrow)
- Time slot selection (9:00–17:00, 30min intervals)

**Step 6 (Addons):**
- Hosting, domain, maintenance packages
- Monthly/yearly toggle
- Per-month price shown

### Step 4 — FE: Wire Wizard Step 7 (Review) + Step 8 (Payment)

**Owner: FE**

**Step 7 — Review:**
- Full breakdown: service + package + features + addons + staff + schedule
- Subtotal, LP discount line, tax (10%), final total
- LP balance check: show `max LP redeemable`

**Step 8 — Payment:**
- LP slider: drag to apply LP, shows `max 20% of total`
- VNĐ input: show remaining after LP deduction
- Payment method: Bank transfer / QR / COD
- Confirm → `POST /api/quote`
- Success: show order ID, estimated response time

### Step 5 — FE: Admin OrdersTab (Standalone)

**Owner: FE**

1. Extract `OrdersTab` from inline `AdminDashboard.tsx`
2. Create `src/app/components/admin/OrdersTab.tsx`
3. Register in routes/admin tabs array
4. Features:
   - Kanban-style pipeline view (status columns)
   - Table view toggle
   - Filter by status, date range, customer
   - Sort by date, total, status
   - Pagination (20/page)

**Order Detail Panel:**
- Customer info
- Service/package breakdown
- LP discount applied
- Status timeline with timestamps
- Action buttons (advance status, send demo, chat)
- Demo URL field (masked until approved)

### Step 6 — BE: Order Status Transitions

**Owner: BE**

**`POST /api/admin/orders/[id]/transition`:**
```json
// Request
{ "action": "advance" | "reject", "note": "Gửi demo cho khách" }

// Valid transitions:
pending_payment → paid (mark as paid)
paid → in_progress (assign PM, start work)
in_progress → demo_ready (upload demo URL)
demo_ready → client_review (send to client)
client_review → done | revisions_requested
done → (terminal)

// Response
{ "data": { "orderId": "...", "newStatus": "...", "updatedAt": "..." } }
```

### Step 7 — BE: Demo URL Send

**Owner: BE**

**`POST /api/admin/orders/[id]/demo`:**
- Generate masked URL: `loop.com/demo/[base64(orderId + timestamp)]`
- Store in `FigmaDemo` or `OrderDemoLink` model
- Send notification to customer (email/in-app)
- Return masked URL to admin

### Step 8 — FE: Customer Dashboard Orders

**Owner: FE**

1. CustomerDashboard → Orders tab
2. `GET /api/customer/orders` → list customer's orders
3. Order card: service name, status badge, total, date
4. Order detail: full breakdown + status timeline
5. Demo viewer: if demo ready, show masked URL with DemoViewer component
6. LP reward banner: "Bạn nhận được X LP khi hoàn thành dự án"

---

## 5. API Contract Checklist

### Wizard / Quote
- [ ] `GET /api/pricing/config` → FE Wizard load config
- [ ] `POST /api/pricing/calculate` → real-time price preview
- [ ] `POST /api/quote` → create Order from wizard

### Order Management (Admin)
- [ ] `GET /api/admin/orders` → list with filter/pagination
- [ ] `GET /api/admin/orders/[id]` → order detail
- [ ] `POST /api/admin/orders/[id]/transition` → advance/reject status
- [ ] `POST /api/admin/orders/[id]/demo` → send demo URL

### Customer
- [ ] `GET /api/customer/orders` → list customer's orders
- [ ] `GET /api/customer/orders/[id]` → order detail

### LP Integration
- [ ] `GET /api/customer/points` → LP balance (for Step 8 display)
- [ ] LP discount applied server-side in `POST /api/quote`

---

## 6. LP Discount Rule

```
Rate: 1,000 LP = 500,000 VND
Max discount: 20% of order total
Formula: lpDiscount = min(lpToRedeem / 1000 * 500000, total * 0.20)
```

FE validates in Step 8 slider: `lpAmount <= min(lpBalance, total * 0.20)`
BE re-validates on submit — reject if exceeds.

---

## 7. Data Flow

```
[Wizard Step 8]
  → bookingService.submitQuote(payload)
  → POST /api/quote
  → BE: validate LP, create Order (status=pending_payment)
  → Return { orderId, total, lpDiscount }

[Admin Dashboard]
  → GET /api/admin/orders → list
  → POST /api/admin/orders/[id]/transition → advance status
  → POST /api/admin/orders/[id]/demo → masked URL

[Customer Dashboard]
  → GET /api/customer/orders → list
  → Order detail with status timeline
  → Demo viewer (if demo_ready)
```

---

## 8. File Changes Summary

### Files to create (FE)
```
src/api/booking.service.ts         # NEW — pricing config, quote submit
src/api/orders.service.ts          # NEW — admin orders CRUD
src/app/components/admin/OrdersTab.tsx  # NEW — standalone orders tab
```

### Files to update (FE)
```
src/app/pages/BookingWizardPage.tsx     # wire API calls, LP slider
src/app/pages/AdminDashboard.tsx        # import OrdersTab, add to tabs
src/app/store/loopStore.ts              # add order types, update init data
src/app/routes.tsx                      # add /admin tabs if needed
```

### Files to update (BE)
```
src/app/api/quote/route.ts              # NEW — POST /api/quote
src/app/api/pricing/config/route.ts      # NEW — GET /api/pricing/config
src/app/api/admin/orders/[id]/transition/route.ts  # NEW
src/app/api/admin/orders/[id]/demo/route.ts        # NEW
src/app/api/customer/orders/route.ts    # NEW or extend existing
```

---

## 9. Testing Scenarios

1. Wizard: chọn service + package + 3 features + 1 addon → price updates correctly
2. Wizard: apply LP slider → max 20% enforced, LP discount shown
3. Wizard: submit → order appears in Admin OrdersTab
4. Admin: advance order through all statuses → timeline updates
5. Admin: send demo → customer sees masked URL
6. Customer: view order in dashboard → correct status + breakdown
7. LP: redeem more than 20% → BE rejects with 400
8. LP: redeem more than balance → FE slider caps at balance
9. BE offline: wizard shows error state, doesn't crash
10. Order: LP reward banner shown after order completion

---

## 10. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| BE quote endpoint validation complex → delay BE | High | Medium | BE creates minimal POST /quote first; FE uses optimistic UI |
| LP rate changes (1000 LP = X VND) | Medium | Low | Store rate in BE pricing config, not hardcoded in FE |
| Wizard payload large (many features) → request too big | Low | Low | Paginate features, POST only selected IDs |
| Order status transition race condition | Medium | Low | BE uses atomic update with status check |
| Demo URL masking logic not finalized | Medium | Medium | Use base64(orderId + secret) as minimal MVP |

---

## 11. Owner Assignment

** sequencing: BE endpoints MUST be completed before FE wiring begins. FE creates `booking.service.ts` with proper types, but uses mock/stub data until BE contract is confirmed.**

| Task | Owner | Dependency |
|------|-------|-----------|
| BE: `GET /api/pricing/config` | BE Lead | None |
| BE: `POST /api/quote` | BE Lead | pricing/config done |
| BE: `POST /api/admin/orders/[id]/transition` | BE Lead | quote done |
| BE: `POST /api/admin/orders/[id]/demo` | BE Lead | transition done |
| FE: `booking.service.ts` types + stubs | FE | BE contract confirmed |
| FE: BookingWizardPage Steps 1–6 wiring | FE | pricing/config done |
| FE: BookingWizardPage Steps 7–8 wiring | FE | Steps 1–6 done |
| FE: OrdersTab standalone | FE | orders list API done |
| FE: Customer orders tab | FE | customer orders API done |
| QA: end-to-end test | QA | All above done |

---

## 12. Exit Criteria

- [ ] Wizard submits → order created in DB → appears in Admin OrdersTab
- [ ] Admin can advance order through all 6 statuses
- [ ] Admin can send demo → customer sees masked URL
- [ ] LP discount ≤20% enforced both FE and BE
- [ ] Customer sees order in dashboard with correct status
- [ ] Loading/empty/error states handled for all API calls
- [ ] Lint + type-check + build pass

---

## 13. i18n Addendum (5 Locale Compliance for F2)

### 13.1 Endpoint-level i18n requirements

- `GET /api/pricing/config`:
  - Accepts optional `?lang=vi|en|ja|ko|zh`
  - Returns localized display fields for wizard options
  - If locale field missing, fallback to `vi`
- `GET /api/admin/orders` (admin view):
  - Data codes remain invariant (`status` as code)
  - FE maps status labels by locale
- `POST /api/admin/orders/[id]/demo`:
  - Customer-facing notification text should be locale-aware when locale is available

### 13.2 FE-level i18n requirements (F2 pages/components)

- `BookingWizardPage.tsx`
  - New text added during F2 must come from i18n messages (or a locale map layer)
  - Wizard option labels (service/package/feature/addon) must use locale-aware fields from API response
- `OrdersTab.tsx`
  - Admin internal labels may remain VI
  - Any customer-facing message template should support locale fallback (`vi` default)
- `CustomerDashboard.tsx`
  - Status labels, CTA labels, timeline labels should map from locale dictionary (vi/en/ja/ko/zh)

### 13.3 F2 i18n test checklist (must pass)

- [ ] `/vi/dat-lich` wizard renders correctly
- [ ] `/en/dat-lich` wizard renders correctly
- [ ] `/ja/dat-lich` wizard renders correctly
- [ ] `/ko/dat-lich` wizard renders correctly
- [ ] `/zh/dat-lich` wizard renders correctly
- [ ] Locale switch does not reset wizard state unexpectedly
- [ ] Missing translation field falls back to VI cleanly (no undefined text)

### 13.4 i18n risks in F2 and mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Wizard config labels only in VI | EN/JA/KO/ZH UX degraded | Add `?lang=` or multilingual fields in `pricing/config` |
| Status text hardcoded VI in customer view | inconsistent multilingual UX | FE status locale map by code |
| Demo notification message always VI | wrong customer language | pass locale context and template per locale |

### 13.5 F2 done definition extension (i18n)

F2 is not fully done unless:
- [ ] Core wizard path works for 5 locales (`vi/en/ja/ko/zh`)
- [ ] No newly introduced hard-coded customer-facing text without locale mapping
- [ ] i18n fallback policy verified in manual smoke
- [ ] API locale behavior documented in F2 delivery notes

---

## 14. Clarified Constraints (from planning questions)

- Step 6 Addons UI exists already in FE → wire only.
- LP balance source uses `authStore.lpBalance` for F2.
- Sequence: BE endpoints first, FE wiring second (no mock leak).
- i18n 5-locale compliance is mandatory for customer-facing F2 flows.

---

## 15. Current Implementation Status (2026-03-29 session)

### ✅ Implemented
- BE: `GET /api/pricing/config`
- BE: `POST /api/admin/orders/[id]/demo`
- FE: `src/api/booking.service.ts`
- FE: `BookingWizardPage` wired to pricing config API (+ fallback)
- FE: `OrdersTab` wired with BE transition + demo send flow
- FE: `CustomerDashboard` projects/orders wired to BE orders list with demo metadata
- FE: LP discount calculation wired via `booking.service` helper

### ⏳ Remaining
- i18n extraction for newly added customer-facing labels in F2 components
- explicit locale param propagation for `pricing/config` call where needed
- locale map for order status labels in customer-facing panels
- 5-locale smoke verification for F2 flow

---

## 16. Immediate Next Actions (i18n-focused)

1. Add locale context to `bookingService.getPricingConfig(lang)` and pass current locale.
2. Introduce status locale map in customer-facing order views.
3. Move any newly introduced hardcoded customer text in F2 components to locale dictionaries.
4. Execute 5-locale smoke checklist for `/dat-lich` and customer order views.
5. Log F2 i18n verification results in weekly status report.

---

## 17. F2 API Contract Checklist (updated)

### Wizard / Quote
- [ ] `GET /api/pricing/config?lang=` → locale-aware wizard config
- [ ] `POST /api/pricing/calculate` → real-time price preview
- [ ] `POST /api/pricing/quote` → create QuoteRequest/Order intent

### Order Management (Admin)
- [ ] `GET /api/admin/orders` → list with pagination + latest demo metadata
- [ ] `GET /api/admin/orders/[id]` → order detail
- [ ] `POST /api/admin/orders/[id]/transition` → advance status
- [ ] `POST /api/admin/orders/[id]/demo` → send demo link

### Customer
- [ ] `GET /api/admin/orders?customerEmail=` (current implementation path)
- [ ] Optional: `GET /api/customer/orders` (future clean endpoint)

### LP + i18n
- [ ] LP discount ≤ 20% enforced FE+BE
- [ ] Locale fallback to VI verified on missing fields

---

## 18. Final Exit Criteria (F2 + i18n)

- [ ] Wizard submits and order appears in admin list
- [ ] Admin transitions status successfully via BE
- [ ] Admin sends demo and customer sees demo metadata
- [ ] Customer order list uses real API data
- [ ] LP discount logic enforced via shared helper + BE validation
- [ ] 5-locale customer-facing flow sanity checked
- [ ] No new hardcoded customer-facing strings without locale mapping
- [ ] Lint + type-check + build pass (excluding known unrelated baseline issues)

---

## 19. Notes

- There is an existing unrelated type error in `src/app/[locale]/team/page.tsx` (`team` field mismatch). This predates F2 changes and should be tracked separately.
- Current F2 implementation keeps fallback-safe behavior when BE endpoints fail.
- i18n completion for F2 should be tracked as mandatory acceptance, not optional hardening.

**FE tasks:**
1. Tạo `src/api/booking.service.ts` — pricing config, calculate, submit quote
2. Wiring Wizard Step 1–6: thay hard-coded data → gọi `GET /api/pricing/config`
3. Wiring Wizard Step 7 (review): hiển thị breakdown từ calculation response
4. Wiring Wizard Step 8 (payment): LP discount ≤20%, `1000 LP = 500,000 VND`
5. Submit wizard → `POST /api/quote` → tạo Order
6. Success screen: hiển thị order ID, redirect options

**BE tasks:**
1. `POST /api/quote` — validate wizard payload → create Order (status: `pending_payment`)
2. `GET /api/pricing/config` — trả services/packages/features/addons cho wizard

### P1 — Admin Order Management

**FE tasks:**
1. Tách `OrdersTab.tsx` từ inline trong AdminDashboard → standalone component
2. Admin OrdersTab: list orders + filter (status, date, customer)
3. Order detail panel: view full order breakdown
4. Status transition buttons: `pending_payment → paid → in_progress → demo_ready → client_review → done`
5. Send demo: `POST /api/admin/orders/[id]/demo` → masked URL → customer notification

**BE tasks:**
1. `POST /api/admin/orders/[id]/transition` — advance status với validation
2. `POST /api/admin/orders/[id]/demo` — generate masked demo URL
3. Order list: pagination + filter support

### P2 — Customer Dashboard Orders

**FE tasks:**
1. CustomerDashboard orders tab: list customer's orders
2. Order status timeline view
3. Demo viewer link (masked URL)
4. LP reward display per order

---

## 4. Step-by-Step Implementation

### Step 1 — BE: Pricing Config + Quote Endpoint

### Clarified Constraints (from planning questions)

- **Step 6 Addons UI:** Đã có trong `BookingWizardPage.tsx` — chỉ cần wire data, không cần tạo mới.
- **LP balance source:** Dùng `authStore.lpBalance` (local state, đã có sau login) — không cần gọi BE mỗi lần.
- **BE vs FE sequencing:** **BE tạo endpoints trước** (`pricing/config` + `/quote` + transition), sau đó FE wire. Không có mock leak — FE chờ BE contract.

### Step 1 — BE: Pricing Config + Quote Endpoint

**Owner: BE**

**`GET /api/pricing/config`** — trả toàn bộ wizard data:
```json
{
  "data": {
    "services": [{ "id": "...", "name": "Thiết kế Web", "slug": "...", "basePrice": 15000000 }],
    "packages": [
      { "id": "starter", "name": "Starter", "multiplier": 1.0, "description": "..." },
      { "id": "business", "name": "Business", "multiplier": 2.2, "description": "..." },
      { "id": "enterprise", "name": "Enterprise", "multiplier": 3.8, "description": "..." }
    ],
    "features": [{ "id": "...", "name": "...", "price": 2000000, "category": "..." }],
    "addons": [{ "id": "...", "name": "...", "price": 500000, "perMonth": true }],
    "lpRate": { "lpPerVnd": 500000, "maxDiscount": 0.20 }
  }
}
```

**`POST /api/quote`** — nhận wizard payload → tạo Order:
```json
// Request
{
  "serviceId": "...",
  "packageId": "starter|business|enterprise",
  "selectedFeatures": ["feature-id-1", "feature-id-2"],
  "selectedAddons": ["addon-id-1"],
  "staffAssignment": "member-id|null",
  "scheduledDate": "2026-04-15T09:00:00Z",
  "customerInfo": { "name": "...", "email": "...", "phone": "..." },
  "lpToRedeem": 0,
  "notes": "..."
}

// Response
{ "data": { "orderId": "...", "status": "pending_payment", "total": 18500000, "lpDiscount": 0 } }
```

**Validation rules:**
- `lpToRedeem * 500000 <= total * 0.20` (max 20% discount)
- `scheduledDate` must be future
- At least 1 service selected

### Step 2 — FE: Booking Service Layer

**Owner: FE**

**`src/api/booking.service.ts`:**
```typescript
export interface PricingConfig {
  services: WizardService[];
  packages: ServicePackage[];
  features: Feature[];
  addons: AddonService[];
  lpRate: { lpPerVnd: number; maxDiscount: number };
}

export interface QuoteRequest {
  serviceId: string;
  packageId: string;
  selectedFeatures: string[];
  selectedAddons: string[];
  staffAssignment: string | null;
  scheduledDate: string;
  customerInfo: { name: string; email: string; phone: string };
  lpToRedeem: number;
  notes: string;
}

export const bookingService = {
  getPricingConfig: () => api.get<PricingConfig>('/pricing/config'),
  calculateQuote: (req: Partial<QuoteRequest>) =>
    api.post<{ total: number; lpDiscount: number; breakdown: PriceBreakdown }>('/pricing/calculate', req),
  submitQuote: (req: QuoteRequest) =>
    api.post<{ orderId: string; status: string; total: number }>('/quote', req),
};
```

### Step 3 — FE: Wire Wizard Steps 1–6

**Owner: FE**

**Step 1 (Service):**
- `GET /api/pricing/config` → render 4 service cards
- Click → set `selectedService`, advance to Step 2

**Step 2 (Package):**
- 3 package options (Starter/Business/Enterprise)
- Show price: `service.basePrice × package.multiplier`
- Highlight recommended

**Step 3 (Features):**
- Group features by category (UI/Backend/SEO/...)
- Multi-select checklist
- Running total updates in real-time

**Step 4 (Staff):**
- `GET /api/v1/team` → show available team members
- Optional — can skip

**Step 5 (Schedule):**
- Date picker (min: tomorrow)
- Time slot selection (9:00–17:00, 30min intervals)

**Step 6 (Addons):**
- Hosting, domain, maintenance packages
- Monthly/yearly toggle
- Per-month price shown

### Step 4 — FE: Wire Wizard Step 7 (Review) + Step 8 (Payment)

**Owner: FE**

**Step 7 — Review:**
- Full breakdown: service + package + features + addons + staff + schedule
- Subtotal, LP discount line, tax (10%), final total
- LP balance check: show `max LP redeemable`

**Step 8 — Payment:**
- LP slider: drag to apply LP, shows `max 20% of total`
- VNĐ input: show remaining after LP deduction
- Payment method: Bank transfer / QR / COD
- Confirm → `POST /api/quote`
- Success: show order ID, estimated response time

### Step 5 — FE: Admin OrdersTab (Standalone)

**Owner: FE**

1. Extract `OrdersTab` from inline `AdminDashboard.tsx`
2. Create `src/app/components/admin/OrdersTab.tsx`
3. Register in routes/admin tabs array
4. Features:
   - Kanban-style pipeline view (status columns)
   - Table view toggle
   - Filter by status, date range, customer
   - Sort by date, total, status
   - Pagination (20/page)

**Order Detail Panel:**
- Customer info
- Service/package breakdown
- LP discount applied
- Status timeline with timestamps
- Action buttons (advance status, send demo, chat)
- Demo URL field (masked until approved)

### Step 6 — BE: Order Status Transitions

**Owner: BE**

**`POST /api/admin/orders/[id]/transition`:**
```json
// Request
{ "action": "advance" | "reject", "note": "Gửi demo cho khách" }

// Valid transitions:
pending_payment → paid (mark as paid)
paid → in_progress (assign PM, start work)
in_progress → demo_ready (upload demo URL)
demo_ready → client_review (send to client)
client_review → done | revisions_requested
done → (terminal)

// Response
{ "data": { "orderId": "...", "newStatus": "...", "updatedAt": "..." } }
```

### Step 7 — BE: Demo URL Send

**Owner: BE**

**`POST /api/admin/orders/[id]/demo`:**
- Generate masked URL: `loop.com/demo/[base64(orderId + timestamp)]`
- Store in `FigmaDemo` or `OrderDemoLink` model
- Send notification to customer (email/in-app)
- Return masked URL to admin

### Step 8 — FE: Customer Dashboard Orders

**Owner: FE**

1. CustomerDashboard → Orders tab
2. `GET /api/customer/orders` → list customer's orders
3. Order card: service name, status badge, total, date
4. Order detail: full breakdown + status timeline
5. Demo viewer: if demo ready, show masked URL with DemoViewer component
6. LP reward banner: "Bạn nhận được X LP khi hoàn thành dự án"

---

## 5. API Contract Checklist

### Wizard / Quote
- [ ] `GET /api/pricing/config` → FE Wizard load config
- [ ] `POST /api/pricing/calculate` → real-time price preview
- [ ] `POST /api/quote` → create Order from wizard

### Order Management (Admin)
- [ ] `GET /api/admin/orders` → list with filter/pagination
- [ ] `GET /api/admin/orders/[id]` → order detail
- [ ] `POST /api/admin/orders/[id]/transition` → advance/reject status
- [ ] `POST /api/admin/orders/[id]/demo` → send demo URL

### Customer
- [ ] `GET /api/customer/orders` → list customer's orders
- [ ] `GET /api/customer/orders/[id]` → order detail

### LP Integration
- [ ] `GET /api/customer/points` → LP balance (for Step 8 display)
- [ ] LP discount applied server-side in `POST /api/quote`

---

## 6. LP Discount Rule

```
Rate: 1,000 LP = 500,000 VND
Max discount: 20% of order total
Formula: lpDiscount = min(lpToRedeem / 1000 * 500000, total * 0.20)
```

FE validates in Step 8 slider: `lpAmount <= min(lpBalance, total * 0.20)`
BE re-validates on submit — reject if exceeds.

---

## 7. Data Flow

```
[Wizard Step 8]
  → bookingService.submitQuote(payload)
  → POST /api/quote
  → BE: validate LP, create Order (status=pending_payment)
  → Return { orderId, total, lpDiscount }

[Admin Dashboard]
  → GET /api/admin/orders → list
  → POST /api/admin/orders/[id]/transition → advance status
  → POST /api/admin/orders/[id]/demo → masked URL

[Customer Dashboard]
  → GET /api/customer/orders → list
  → Order detail with status timeline
  → Demo viewer (if demo_ready)
```

---

## 8. File Changes Summary

### Files to create (FE)
```
src/api/booking.service.ts         # NEW — pricing config, quote submit
src/api/orders.service.ts          # NEW — admin orders CRUD
src/app/components/admin/OrdersTab.tsx  # NEW — standalone orders tab
```

### Files to update (FE)
```
src/app/pages/BookingWizardPage.tsx     # wire API calls, LP slider
src/app/pages/AdminDashboard.tsx        # import OrdersTab, add to tabs
src/app/store/loopStore.ts              # add order types, update init data
src/app/routes.tsx                      # add /admin tabs if needed
```

### Files to update (BE)
```
src/app/api/quote/route.ts              # NEW — POST /api/quote
src/app/api/pricing/config/route.ts      # NEW — GET /api/pricing/config
src/app/api/admin/orders/[id]/transition/route.ts  # NEW
src/app/api/admin/orders/[id]/demo/route.ts        # NEW
src/app/api/customer/orders/route.ts    # NEW or extend existing
```

---

## 9. Testing Scenarios

1. Wizard: chọn service + package + 3 features + 1 addon → price updates correctly
2. Wizard: apply LP slider → max 20% enforced, LP discount shown
3. Wizard: submit → order appears in Admin OrdersTab
4. Admin: advance order through all statuses → timeline updates
5. Admin: send demo → customer sees masked URL
6. Customer: view order in dashboard → correct status + breakdown
7. LP: redeem more than 20% → BE rejects with 400
8. LP: redeem more than balance → FE slider caps at balance
9. BE offline: wizard shows error state, doesn't crash
10. Order: LP reward banner shown after order completion

---

## 10. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| BE quote endpoint validation complex → delay BE | High | Medium | BE creates minimal POST /quote first; FE uses optimistic UI |
| LP rate changes (1000 LP = X VND) | Medium | Low | Store rate in BE pricing config, not hardcoded in FE |
| Wizard payload large (many features) → request too big | Low | Low | Paginate features, POST only selected IDs |
| Order status transition race condition | Medium | Low | BE uses atomic update with status check |
| Demo URL masking logic not finalized | Medium | Medium | Use base64(orderId + secret) as minimal MVP |

---

## 11. Owner Assignment

** sequencing: BE endpoints MUST be completed before FE wiring begins. FE creates `booking.service.ts` with proper types, but uses mock/stub data until BE contract is confirmed.**

| Task | Owner | Dependency |
|------|-------|-----------|
| BE: `GET /api/pricing/config` | BE Lead | None |
| BE: `POST /api/quote` | BE Lead | pricing/config done |
| BE: `POST /api/admin/orders/[id]/transition` | BE Lead | quote done |
| BE: `POST /api/admin/orders/[id]/demo` | BE Lead | transition done |
| FE: `booking.service.ts` types + stubs | FE | BE contract confirmed |
| FE: BookingWizardPage Steps 1–6 wiring | FE | pricing/config done |
| FE: BookingWizardPage Steps 7–8 wiring | FE | Steps 1–6 done |
| FE: OrdersTab standalone | FE | orders list API done |
| FE: Customer orders tab | FE | customer orders API done |
| QA: end-to-end test | QA | All above done |

---

## 12. Exit Criteria

- [ ] Wizard submits → order created in DB → appears in Admin OrdersTab
- [ ] Admin can advance order through all 6 statuses
- [ ] Admin can send demo → customer sees masked URL
- [ ] LP discount ≤20% enforced both FE and BE
- [ ] Customer sees order in dashboard with correct status
- [ ] Loading/empty/error states handled for all API calls
- [ ] Lint + type-check + build pass
