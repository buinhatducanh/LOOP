# FE Week 07 Plan — LOOP Solutions

> **Tuần:** Week 07
> **Mục tiêu tuần:** Tích hợp Media Booking flow thật từ booking đến quản trị đơn media.
> **Cập nhật:** 2026-03-26

---

## 1) Sprint Goal
1. Media booking wizard dùng API thật.
2. Admin media tab quản trị booking lifecycle cơ bản.
3. Customer theo dõi trạng thái media booking trên portal.

---

## 2) Scope tuần 07

## P0
- [ ] Media service/package/options integration.
- [ ] Tạo media booking bằng API thật.
- [ ] Admin media tab list/detail/update status.
- [ ] Customer portal media booking list/status.

## P1
- [ ] Upload/delivery metadata baseline.
- [ ] Notification khi trạng thái media đổi.

## P2
- [ ] Delivery preview UX cải thiện.

---

## 3) Kế hoạch theo ngày
- **Day 1:** Wizard config + calculate
- **Day 2:** Create media booking
- **Day 3:** Admin media tab integration
- **Day 4:** Customer portal media section
- **Day 5:** QA + hardening

---

## 4) API checklist
- [ ] `GET /api/media-booking/config`
- [ ] `POST /api/media-booking/calculate`
- [ ] `POST /api/media-booking`
- [ ] `GET /api/admin/media-bookings`
- [ ] `PUT /api/admin/media-bookings/[id]/status`

---

## 5) DoD
- [ ] Media booking flow API thật chạy end-to-end
- [ ] Admin xử lý booking media ổn định
- [ ] Lint/type-check/build pass
