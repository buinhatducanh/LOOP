# FE Week 10 Plan — LOOP Solutions

> **Tuần:** Week 10
> **Mục tiêu tuần:** Chuẩn hóa tax/invoice hiển thị FE và đồng bộ với flow order/payment.
> **Cập nhật:** 2026-03-26

---

## 1) Sprint Goal
1. Invoice/payment views dùng dữ liệu thật.
2. Tax breakdown hiển thị rõ và đúng nghiệp vụ.
3. Customer/admin nhìn cùng một nguồn dữ liệu tài chính nhất quán.

---

## 2) Scope tuần 10

## P0
- [ ] Invoice list/detail integration.
- [ ] Payment status sync theo order.
- [ ] Tax breakdown trên summary/invoice.

## P1
- [ ] LP + VNĐ mixed payment display rõ ràng.
- [ ] Export invoice baseline.

## P2
- [ ] Billing UX polish.

---

## 3) Kế hoạch theo ngày
- **Day 1:** Invoice APIs integration
- **Day 2:** Payment status sync
- **Day 3:** Tax breakdown UI + validation
- **Day 4:** Customer/admin reconciliation checks
- **Day 5:** QA + release hardening

---

## 4) API checklist
- [ ] `GET /api/admin/orders/[id]/payments`
- [ ] `GET /api/customer/invoices` (hoặc tương đương)
- [ ] tax-related endpoints theo contract

---

## 5) DoD
- [ ] Invoice/tax/payment views dùng API thật
- [ ] Dữ liệu tài chính hiển thị nhất quán
- [ ] Lint/type-check/build pass
