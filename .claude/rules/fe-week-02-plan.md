# FE Week 02 Plan — LOOP Solutions

> **Tuần:** Week 02
> **Mục tiêu tuần:** Hoàn thiện tích hợp flow báo giá 8 bước + tạo order thực tế + đồng bộ trạng thái sang admin.
> **Cập nhật:** 2026-03-26

---

## 1) Sprint Goal (đo được)

Trong tuần 02, đạt các kết quả bắt buộc:
1. Booking wizard 8 bước dùng API thật cho dữ liệu cấu hình và tính giá.
2. Tạo được quote/order thật từ wizard.
3. Admin nhìn thấy order mới và xử lý transition trạng thái cơ bản.
4. FE/BE pass lint + type-check + smoke test flow end-to-end.

---

## 2) Scope tuần 02

## P0 (bắt buộc)
- [ ] Wizard data sources dùng API thật:
  - [ ] Dịch vụ
  - [ ] Gói + multiplier
  - [ ] Tính năng tùy chọn
  - [ ] Dịch vụ thêm
  - [ ] Nhân sự/talent
- [ ] Endpoint tính giá hoạt động đúng rule:
  - [ ] subtotal
  - [ ] LP discount (max 20%)
  - [ ] tax
  - [ ] final total
- [ ] Endpoint tạo quote/order từ wizard.
- [ ] FE hiển thị summary + validation đầy đủ trước submit.
- [ ] Admin nhận order mới và xem chi tiết order.

## P1 (quan trọng)
- [ ] Trạng thái order transition cơ bản (`pending_payment -> paid -> in_progress`).
- [ ] Notification cơ bản sau khi tạo order.
- [ ] Adapter mapping cho trường hợp endpoint trả slug/id khác nhau.

## P2 (nếu còn thời gian)
- [ ] Export quote dạng PDF bản đầu (MVP).
- [ ] A/B nhẹ cho bố cục bước thanh toán.

---

## 3) Phân rã task theo ngày

## Day 1 — Wizard config APIs
- [ ] Kết nối API dữ liệu cấu hình 8 bước.
- [ ] Chuẩn hóa kiểu dữ liệu FE cho wizard state.
- [ ] Bổ sung fallback/loading/empty/error cho từng bước.
- **Output:** Wizard render từ data thật.

## Day 2 — Pricing calculation
- [ ] Kết nối endpoint calculate.
- [ ] Tính lại giá theo mỗi thay đổi input.
- [ ] Validate LP usage limit + tax display.
- **Output:** Summary giá đúng nghiệp vụ.

## Day 3 — Quote + Order submit
- [ ] Submit quote/order bằng API thật.
- [ ] Redirect/confirm state sau submit.
- [ ] Lưu history tối thiểu để support/debug.
- **Output:** Tạo order thành công từ wizard.

## Day 4 — Admin handling
- [ ] Admin tab Orders đọc được order mới.
- [ ] Xem detail + thao tác transition trạng thái cơ bản.
- [ ] Kiểm tra RBAC endpoint liên quan.
- **Output:** Flow user -> admin khép kín.

## Day 5 — Hardening + QA
- [ ] Smoke test end-to-end flow đầy đủ.
- [ ] Chạy lint/type-check/build.
- [ ] Ghi nhận bugs + finalize changelog.
- **Output:** Week 02 release candidate.

---

## 4) API checklist tuần 02

- [ ] `GET /api/pricing` (hoặc endpoint config tương đương)
- [ ] `GET /api/pricing/features`
- [ ] `POST /api/pricing/calculate`
- [ ] `POST /api/pricing/quote`
- [ ] `POST /api/admin/orders`
- [ ] `GET /api/admin/orders`
- [ ] `PUT /api/admin/orders/[id]` hoặc transition endpoint tương đương

---

## 5) QA scenario bắt buộc

1. Chọn nhiều cấu hình wizard -> tổng giá cập nhật đúng.
2. Dùng LP vượt ngưỡng -> bị chặn đúng rule.
3. Submit thành công -> admin thấy order mới.
4. Admin đổi trạng thái cơ bản -> UI khách cập nhật đúng khi reload.
5. API lỗi tạm thời -> FE hiện lỗi thân thiện, không crash.

---

## 6) Definition of Done (Week 02)

- [ ] Wizard 8 bước dùng API thật.
- [ ] Pricing calculation chính xác theo rule hiện hành.
- [ ] Tạo order thật thành công.
- [ ] Admin xử lý order mới được.
- [ ] Lint + type-check + build pass.

---

## 7) Rủi ro & phương án

## Rủi ro
- Rule pricing/tax thay đổi giữa tuần.
- Chưa thống nhất endpoint config wizard.
- Transition status thiếu guard nghiệp vụ.

## Mitigation
- Chốt pricing rules bằng config/version trước Day 2.
- Freeze contract wizard trong tuần.
- Bổ sung validation + permission check tại BE.

---

## 8) Báo cáo cuối tuần (template)

- **Done:**
- **Not done:**
- **Blockers:**
- **Bug phát hiện:**
- **Tech debt tạo mới:**
- **Plan tuần 03 đề xuất:**

---

## 9) Lệnh kiểm tra trước chốt tuần

```bash
npm run lint
npx tsc --noEmit
npm run build
```
