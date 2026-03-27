# FE Week 09 Plan — LOOP Solutions

> **Tuần:** Week 09
> **Mục tiêu tuần:** Thiết lập analytics dashboard baseline với dữ liệu thật cho admin.
> **Cập nhật:** 2026-03-26

---

## 1) Sprint Goal
1. Overview + analytics tab lấy KPI thật.
2. Charts/list reports chạy dữ liệu backend.
3. Tracking events cơ bản được ghi nhận ổn định.

---

## 2) Scope tuần 09

## P0
- [ ] KPI summary integration (orders/revenue/clients).
- [ ] Analytics tab charts integration.
- [ ] Tracking endpoint integration cho page + CTA events.

## P1
- [ ] Filter theo thời gian (day/week/month/quarter).
- [ ] Export report baseline (CSV hoặc JSON).

## P2
- [ ] Compare period-over-period MVP.

---

## 3) Kế hoạch theo ngày
- **Day 1:** KPI endpoints integration
- **Day 2:** Charts/report widgets
- **Day 3:** Tracking events integration
- **Day 4:** Time filters + report baseline
- **Day 5:** QA + data consistency checks

---

## 4) API checklist
- [ ] `GET /api/admin/dashboard/charts`
- [ ] `GET /api/analytics/*` (theo contract)
- [ ] `POST /api/analytics/track`

---

## 5) DoD
- [ ] Analytics baseline chạy API thật
- [ ] KPI hiển thị ổn định
- [ ] Lint/type-check/build pass
