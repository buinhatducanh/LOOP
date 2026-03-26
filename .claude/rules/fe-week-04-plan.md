# FE Week 04 Plan — LOOP Solutions

> **Tuần:** Week 04
> **Mục tiêu tuần:** Hoàn thiện LP economy nền tảng + leaderboard + khởi tạo rank effects integration.
> **Cập nhật:** 2026-03-26

---

## 1) Sprint Goal (đo được)

1. LP balance/transactions/leaderboard dùng API thật.
2. Rule redeem LP (max discount) áp dụng ổn định tại checkout/order.
3. Rank effects bản nền tảng có thể quản trị bật/tắt và hiển thị cơ bản.

---

## 2) Scope tuần 04

## P0
- [ ] LP wallet (balance + history) tích hợp API.
- [ ] LP redeem trong order/payment flow theo rule.
- [ ] Leaderboard page dùng API thật.
- [ ] Admin LP management cơ bản (award/adjust log).

## P1
- [ ] Effects global toggle (bật/tắt toàn hệ thống).
- [ ] Effects danh sách cơ bản theo rank.
- [ ] Notification khi LP thay đổi số dư.

## P2
- [ ] UX nâng cao cho effect preview.

---

## 3) Kế hoạch theo ngày
- **Day 1:** LP APIs integration (balance/history)
- **Day 2:** Redeem rule integration ở order/payment
- **Day 3:** Leaderboard + Admin LP tab
- **Day 4:** Effects baseline integration
- **Day 5:** QA + hardening + release notes

---

## 4) API checklist
- [ ] `GET /api/lp/balance`
- [ ] `GET /api/lp/transactions`
- [ ] `POST /api/lp/redeem`
- [ ] `GET /api/lp/leaderboard`
- [ ] `POST /api/admin/lp-awards` (hoặc tương đương)
- [ ] `GET/PUT /api/admin/effects/*` (baseline)

---

## 5) DoD
- [ ] LP core flow chạy API thật
- [ ] Rule giảm giá LP đúng nghiệp vụ
- [ ] Leaderboard hoạt động ổn định
- [ ] Lint/type-check/build pass
