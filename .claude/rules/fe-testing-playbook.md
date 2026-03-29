# FE Testing Playbook — LOOP Solutions

> **Mục tiêu:** Chuẩn hóa chiến lược test FE theo rủi ro nghiệp vụ và scale-readiness.
> **Cập nhật:** 2026-03-30

---

## 1) Testing levels

- **Smoke:** kiểm tra nhanh flow chính sau mỗi thay đổi lớn.
- **Integration:** kiểm tra module + API contract interactions.
- **E2E:** kiểm tra hành trình user quan trọng end-to-end.
- **Regression:** chạy theo checklist trước release.
- **Resilience (mới):** kiểm tra retry/fallback/cache invalidation.

---

## 2) Risk-based priorities

## Priority 1 (always)
- Auth flows
- Booking/order lifecycle
- Admin core operations
- Payment/invoice/tax displays

## Priority 2
- Academy flow
- LP/effects/leaderboard
- Media booking

## Priority 3
- UI polish, non-critical interactions

---

## 3) Scenario template

- **Scenario ID:**
- **Preconditions:**
- **Steps:**
- **Expected result:**
- **Negative/edge checks:**
- **Observability checks (nếu có):**

---

## 4) Weekly minimum test pack

- [ ] Auth smoke
- [ ] Public module smoke (services/portfolio/blog)
- [ ] Wizard quote/order smoke
- [ ] Admin core tab smoke
- [ ] Error-state sanity checks

---

## 5) Release regression pack

- [ ] Full critical-path E2E
- [ ] Contract mismatch spot-check
- [ ] RBAC/permission checks
- [ ] Performance sanity checks
- [ ] Post-deploy smoke plan prepared

---

## 6) Scale-resilience test pack (F8 baseline, 2026-03-30)

> Các scenario bắt buộc cho P0/P1 features. Mỗi scenario có test plan cụ thể.

### SR-01: Idempotency — Order creation (CRITICAL)
**Purpose:** Xác minh `Idempotency-Key` deduplication prevents double orders.

**Preconditions:** Order wizard đã fill đầy đủ.

**Steps:**
1. Mở wizard → điền form → nhấn Submit
2. Trước khi response về: ngắt network (DevTools → Network → Offline)
3. Thử submit lại → check request header có `Idempotency-Key` không
4. Restore network → chờ response
5. Kiểm tra DB: có đúng 1 order được tạo không?

**Expected:** Chỉ 1 order trong DB (deduplicate by `Idempotency-Key`).
**Fail condition:** 2 orders = idempotency chưa implemented.
**Tools:** DevTools Network tab, Prisma Studio check `Order` table.

---

### SR-02: Idempotency — LP redeem (CRITICAL)
**Purpose:** LP redeem không bị double-deducted khi retry.

**Preconditions:** Customer có LP balance > 0.

**Steps:**
1. Customer đặt hàng → chọn LP discount → nhấn Confirm
2. Ngắt network → submit lại
3. Restore → kiểm tra LP balance deduction

**Expected:** LP deducted đúng 1 lần.
**Fail condition:** LP deducted 2 lần = idempotency gap.

---

### SR-03: Idempotency — Academy enrollment (CRITICAL)
**Purpose:** Enroll không bị double-created khi retry.

**Steps:**
1. Student đăng ký khóa học → nhấn Enroll
2. Ngắt network → retry submit
3. Restore → kiểm tra enrollment

**Expected:** Chỉ 1 enrollment record.
**Fail condition:** 2 enrollment records = idempotency gap.

---

### SR-04: Retry behavior — API timeout/5xx
**Purpose:** FE retry logic đúng exponential backoff.

**Steps:**
1. Mock server trả 503 cho 3 requests liên tiếp
2. Verify FE retry 3 lần với backoff tăng dần
3. Verify request thứ 4 thành công hoặc show error UI

**Expected:** Retry không nhiều hơn 3 lần, exponential backoff 1s→2s→4s.
**Tools:** `scripts/mock-server.ts` hoặc Upstash rate-limit mock.

---

### SR-05: Fallback behavior — BE offline
**Purpose:** UI graceful fallback khi API down tạm thời.

**Steps:**
1. Tắt BE server (`npm run dev` stopped)
2. Mở FE → truy cập ServicesPage
3. Verify: loading skeleton → fallback data hiển thị (không crash, không blank)

**Expected:** Fallback mock data hiển thị thay vì crash/error.
**Fail condition:** Blank page hoặc uncaught error = fallback chưa wired.

---

### SR-06: SSE reconnect — NotificationCenter
**Purpose:** SSE auto-reconnects sau network interruption.

**Steps:**
1. Admin dashboard → mở NotificationCenter
2. SSE connected → Wifi indicator green
3. Ngắt network 10 giây → indicator chuyển WifiOff
4. Restore network → indicator reconnect → green lại

**Expected:** Auto-reconnect trong 3s, không cần reload page.
**Note:** SSE `EventSource` API tự reconnect — chỉ verify behavior.

---

### SR-07: Cache invalidation — Admin list mutation
**Purpose:** Admin create/update/delete invalidate cache đúng scope.

**Steps:**
1. GET `/api/admin/services` → note response headers (Cache-Control)
2. Admin tạo service mới → `POST /api/admin/services`
3. GET `/api/admin/services` lại → verify service mới xuất hiện

**Expected:** Fresh data (no stale cache).
**Note:** Nếu có `stale-while-revalidate`, stale data tạm acceptable nhưng không quá TTL.

---

### SR-08: Order status transition — no data loss
**Purpose:** Order status advance không mất order data.

**Steps:**
1. Tạo order → status `pending_payment`
2. Advance → `paid` → `in_progress` → `demo_ready`
3. Verify: order data (items, customer, total) không thay đổi qua mỗi transition
4. Verify: `OrderStatusHistory` ghi nhận đúng sequence

**Expected:** Data preserved + history recorded.
**Tools:** Prisma Studio → `Order` + `OrderStatusHistory` tables.

---

### SR-09: Inngest job health — email delivery
**Purpose:** Order confirmation email gửi đúng sau order creation.

**Steps:**
1. Tạo order thật → check `InngestJob` table
2. Verify: `status = succeeded`, `errorMessage = null`
3. Check inbox: confirmation email nhận được

**Expected:** Email sent + `InngestJob` record = succeeded.
**Fail condition:** Job failed hoặc email không nhận → check `InngestJob.errorMessage`.

---

### SR-10: DLQ alert — failed job detection
**Purpose:** Failed jobs được phát hiện và alert sớm.

**Steps:**
1. Check `InngestJob` table: `status = failed` trong 7 ngày gần nhất
2. Nếu có failed > 10: verify BE Lead đã notify + có action plan
3. Nếu có failed > 0: check `errorMessage` → xác định root cause

**Expected:** DLQ count = 0 hoặc có active investigation.
**Alert threshold:** Failed > 10 → auto-alert BE Lead (Slack/pager).

---

### SR-11: SSE realtime — live event dispatch
**Purpose:** SSE events từ `useRealtimeNotifications` hook dispatch đúng store action.

**Steps:**
1. Hook `useRealtimeNotifications` đang connected
2. BE emit test event: `{"type":"system_alert","message":"test"}`
3. Verify: `loopStore.addAdminNotification` được gọi
4. Verify: NotificationCenter UI cập nhật

**Expected:** Store notification count tăng + badge hiển thị.
**Note:** Test bằng cách gọi trực tiếp BE endpoint emit SSE event.

---

## 7) Quality gates

- Lint pass
- Type-check pass
- Build pass
- Critical scenarios pass
- Blocker bugs = 0

---

## 8) Test evidence

Mỗi release cần lưu:
- Build/test logs
- Danh sách scenario đã chạy
- Bug list đã đóng/chấp nhận
- QA sign-off record
- Kết quả resilience checks (nếu scope có)
