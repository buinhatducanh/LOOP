# FE Sprint Execution Template — LOOP Solutions

> **Mục tiêu:** Template vận hành sprint hàng tuần cho FE/BE/QA theo flow nghiệp vụ.
> **Chu kỳ đề xuất:** 1 tuần / sprint
> **Cập nhật:** 2026-03-26

---

## 1) Sprint Header

- **Sprint name:** `Sprint-YYYY-WW`
- **Thời gian:** `Từ dd/mm đến dd/mm`
- **Sprint Goal:** (1 câu ngắn, đo được)
- **PO Owner:**
- **Tech Lead:**
- **QA Owner:**
- **Design Owner:**

---

## 2) Ưu tiên sprint (theo nghiệp vụ)

- **P0 (Bắt buộc):**
  1.
  2.
  3.

- **P1 (Quan trọng):**
  1.
  2.

- **P2 (Có thể dời):**
  1.

---

## 3) Scope theo vertical slice (khuyến nghị)

## Slice A — Public flow
- [ ] FE page integration
- [ ] API contract finalized
- [ ] Empty/loading/error states
- [ ] QA scenario pass

## Slice B — Booking/Order flow
- [ ] Wizard step data source thực
- [ ] Pricing calculation endpoint
- [ ] Create quote/order endpoint
- [ ] Admin receives notification
- [ ] QA end-to-end pass

## Slice C — Admin operation flow
- [ ] CRUD chính theo module
- [ ] RBAC guard đúng quyền
- [ ] Audit log & error handling
- [ ] Pagination/filter/sort ổn định

---

## 4) Backlog item template (copy cho từng task)

### [TASK-ID] Tên task
- **Type:** feature / fix / refactor / docs / test
- **Priority:** P0 / P1 / P2
- **Owner:**
- **Estimate:**
- **Dependencies:**
- **API Contract:** endpoint + payload + response
- **Acceptance Criteria:**
  - [ ] AC1
  - [ ] AC2
  - [ ] AC3
- **Test Plan:**
  - [ ] Unit/Integration
  - [ ] E2E scenario
- **Status:** todo / in_progress / blocked / done

---

## 5) Daily execution checklist

## Daily Standup
- [ ] Cập nhật tiến độ theo task ID
- [ ] Báo blocker FE/BE/QA trong ngày
- [ ] Chốt owner xử lý blocker
- [ ] Re-plan nếu P0 có rủi ro trễ

## Daily Quality Gate
- [ ] Không merge code chưa bám API contract
- [ ] Không để mock leak vào production branch
- [ ] Không bỏ qua lint/type-check
- [ ] Review permission và error handling với endpoint mới

---

## 6) Mid-sprint review (giữa tuần)

- [ ] Demo end-to-end flow chính (không demo rời component)
- [ ] Soát lại scope P0/P1/P2
- [ ] Cắt bớt scope nếu có risk release
- [ ] Chốt danh sách regression cần test cuối sprint

---

## 7) Sprint QA Gate (cuối sprint)

## Functional
- [ ] Auth flow pass
- [ ] Order lifecycle pass
- [ ] Booking wizard pass
- [ ] Admin core tabs pass

## Technical
- [ ] `npm run lint` pass
- [ ] `npx tsc --noEmit` pass
- [ ] Critical tests pass
- [ ] No critical vulnerability/secret leak

## Release readiness
- [ ] Changelog ngắn gọn
- [ ] Migration note (nếu có)
- [ ] Rollback plan

---

## 8) Sprint Retrospective template

## Keep
-

## Improve
-

## Action items (tuần sau)
1.
2.
3.

---

## 9) KPI sprint đề xuất

- **Delivery KPI**
  - Sprint completion rate (% task done / planned)
  - P0 completion rate
- **Quality KPI**
  - Defect leakage (bug sau release)
  - Reopen rate
- **Performance KPI**
  - P95 latency endpoint mới
  - Frontend page load baseline (LCP/TTFB)

---

## 10) Lệnh kiểm tra nhanh trước release

```bash
npm run lint
npx tsc --noEmit
npm run build
```
