# FE Testing Playbook — LOOP Solutions

> **Mục tiêu:** Chuẩn hóa chiến lược test FE theo rủi ro nghiệp vụ và scale-readiness.
> **Cập nhật:** 2026-03-28

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

## 6) Scale-resilience test pack (mới)

- [ ] Retry behavior đúng khi API timeout/5xx
- [ ] Fallback behavior đúng khi endpoint down tạm thời
- [ ] Cache invalidation đúng scope sau mutation
- [ ] Không double-submit khi network chậm
- [ ] Reconnect behavior cho realtime channel (nếu có)
- [ ] Queue-backed feature không block UX critical path

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
