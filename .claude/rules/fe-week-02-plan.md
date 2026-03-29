# FE Week 02 Plan — LOOP Solutions

> **Tuần:** Week 02
> **Mục tiêu tuần:** Hoàn thiện tích hợp flow báo giá 8 bước + tạo order thực tế + đồng bộ trạng thái sang admin + i18n 5 locale.
> **Cập nhật:** 2026-03-29

---

## 1) Sprint Goal (đo được)

Trong tuần 02, đạt các kết quả bắt buộc:
1. Booking wizard 8 bước dùng API thật cho dữ liệu cấu hình và tính giá.
2. Wizard + CustomerDashboard labels locale-aware cho 5 ngôn ngữ (vi/en/ja/ko/zh).
3. Tạo được quote/order thật từ wizard.
4. Admin nhìn thấy order mới và xử lý transition trạng thái cơ bản.
5. Pass 5-locale sanity checks trước khi close F2.
6. FE/BE pass lint + type-check + smoke test flow end-to-end.

---

## 2) Scope tuần 02

> ⚠️ **i18n là P0, không phải P2.** Nếu i18n chưa xong → F2 chưa Done.

## P0 (bắt buộc)
### Wizard data + i18n
- [ ] Wizard data sources dùng API thật:
  - [ ] Dịch vụ (`GET /api/pricing/config?lang={locale}`)
  - [ ] Gói + multiplier
  - [ ] Tính năng tùy chọn
  - [ ] Dịch vụ thêm
  - [ ] Nhân sự/talent
- [ ] **Wizard labels locale-aware:** FE lấy locale hiện tại → truyền vào `bookingService.getPricingConfig(lang)`
- [ ] **BE pricing config:** hỗ trợ `?lang=vi|en|ja|ko|zh`, fallback `vi` khi field locale null
- [ ] Endpoint tính giá hoạt động đúng rule:
  - [ ] subtotal
  - [ ] LP discount (max 20%)
  - [ ] tax
  - [ ] final total
- [ ] Endpoint tạo quote/order từ wizard.
- [ ] FE hiển thị summary + validation đầy đủ trước submit.
- [ ] Admin nhận order mới và xem chi tiết order.

### Status labels 5-locale (CustomerDashboard)
- [ ] `ORDER_STATUS_LABELS` map: 6 trạng thái × 5 locale (vi/en/ja/ko/zh)
  - `pending_payment` → "Chờ thanh toán" / "Pending payment" / "支払い待ち" / "결제 대기" / "待支付"
  - `paid` → "Đã thanh toán" / "Paid" / "支払済み" / "결제 완료" / "已支付"
  - `in_progress` → "Đang thực hiện" / "In Progress" / "進行中" / "진행 중" / "进行中"
  - `demo_ready` → "Demo sẵn sàng" / "Demo Ready" / "デモ準備完了" / "데모 준비 완료" / "Demo 就绪"
  - `client_review` → "Khách hàng đánh giá" / "Client Review" / "クライアント確認" / "클라이언트 검토" / "客户审核"
  - `done` → "Hoàn thành" / "Completed" / "完了" / "완료" / "已完成"
- [ ] CustomerDashboard hiển thị status label đúng locale

## P1 (quan trọng)
- [ ] Trạng thái order transition cơ bản (`pending_payment -> paid -> in_progress`).
- [ ] Notification cơ bản sau khi tạo order.
- [ ] Adapter mapping cho trường hợp endpoint trả slug/id khác nhau.

## P2 (nếu còn thời gian)
- [ ] Export quote dạng PDF bản đầu (MVP).
- [ ] A/B nhẹ cho bố cục bước thanh toán.

---

## 3) Phân rã task theo ngày

## Day 1 — Wizard config APIs + i18n foundation
- [ ] Tạo `src/api/booking.service.ts`: `getPricingConfig(lang)` nhận `?lang=` param
- [ ] FE: BookingWizardPage lấy locale hiện tại → truyền vào `getPricingConfig(locale)`
- [ ] Verify pricing config endpoint trả đủ multilingual fields (names, labels) theo locale
- [ ] Chuẩn hóa kiểu dữ liệu FE cho wizard state
- [ ] Bổ sung fallback/loading/empty/error cho từng bước
- [ ] Tạo `src/i18n/orderStatusLabels.ts`: ORDER_STATUS_LABELS map 6 status × 5 locale
- **Output:** Wizard render từ data thật + locale-aware

## Day 2 — Pricing calculation + LP discount
- [ ] Kết nối endpoint calculate
- [ ] Tính lại giá theo mỗi thay đổi input
- [ ] Validate LP usage limit + tax display
- [ ] Verify LP discount rule: max 20%, rate 1000LP=500K VND
- **Output:** Summary giá đúng nghiệp vụ

## Day 3 — Quote + Order submit
- [ ] Submit quote/order bằng API thật
- [ ] Redirect/confirm state sau submit
- [ ] Lưu history tối thiểu để support/debug
- [ ] CustomerDashboard orders tab: dùng API + ORDER_STATUS_LABELS map
- **Output:** Tạo order thành công từ wizard

## Day 4 — Admin handling + status labels QA
- [ ] Admin tab Orders đọc được order mới
- [ ] Xem detail + thao tác transition trạng thái cơ bản
- [ ] Kiểm tra RBAC endpoint liên quan
- [ ] QA 5-locale status labels: verify từng label trong ORDER_STATUS_LABELS map
- **Output:** Flow user -> admin khép kín

## Day 5 — Hardening + 5-locale QA
- [ ] Smoke test end-to-end flow đầy đủ cho VI locale
- [ ] **5-locale sanity: `/vi|en|ja|ko|zh/dat-lich`** → wizard render đúng locale
- [ ] **Fallback test:** locale=en, config=null → Vietnamese fallback hiển thị
- [ ] **Locale switch test:** switch VI→EN→JA→KO→ZH giữa wizard step không crash state
- [ ] Chạy lint/type-check/build
- [ ] Ghi nhận bugs + finalize changelog
- **Output:** Week 02 release candidate + F2 i18n done

---

## 4) API checklist tuần 02

### Pricing + Wizard Config (i18n bắt buộc)
- [ ] `GET /api/pricing/config?lang=vi` → trả config VI (baseline)
- [ ] `GET /api/pricing/config?lang=en` → trả config EN
- [ ] `GET /api/pricing/config?lang=ja` → trả config JA
- [ ] `GET /api/pricing/config?lang=ko` → trả config KO
- [ ] `GET /api/pricing/config?lang=zh` → trả config ZH
- [ ] Fallback: `GET /api/pricing/config?lang=en` khi EN field = null → trả VI fallback
- [ ] `POST /api/pricing/calculate`
- [ ] `POST /api/pricing/quote` (hoặc `POST /api/quote`)

### Orders (Admin + Customer)
- [ ] `GET /api/admin/orders` → list orders
- [ ] `POST /api/admin/orders` (nếu cần)
- [ ] `PUT /api/admin/orders/[id]` hoặc `PUT /api/admin/orders/[id]/transition`

### Optional (P1)
- [ ] `GET /api/orders/[id]/messages`
- [ ] `POST /api/orders/[id]/messages`

---

## 5) QA scenario bắt buộc

### Flow cơ bản
1. Chọn nhiều cấu hình wizard → tổng giá cập nhật đúng.
2. Dùng LP vượt ngưỡng → bị chặn đúng rule.
3. Submit thành công → admin thấy order mới.
4. Admin đổi trạng thái cơ bản → UI khách cập nhật đúng khi reload.
5. API lỗi tạm thời → FE hiện lỗi thân thiện, không crash.

### i18n 5-locale (BẮT BUỘC — không pass = F2 chưa done)
6. `/vi/dat-lich` → wizard hiển thị VI labels (service names, package labels, step labels)
7. `/en/dat-lich` → wizard hiển thị EN labels
8. `/ja/dat-lich` → wizard hiển thị JA labels
9. `/ko/dat-lich` → wizard hiển thị KO labels
10. `/zh/dat-lich` → wizard hiển thị ZH labels
11. Fallback: locale=en, config field EN = null → Vietnamese fallback hiển thị
12. Locale switch VI→EN→JA→KO→ZH giữa wizard step không crash/hỏng state
13. CustomerDashboard: status label đúng locale khi xem order

---

## 6) Definition of Done (Week 02)

- [ ] Wizard 8 bước dùng API thật.
- [ ] Pricing calculation chính xác theo rule hiện hành.
- [ ] Tạo order thật thành công.
- [ ] Admin xử lý order mới được.
- [ ] **ORDER_STATUS_LABELS map đầy đủ 6 status × 5 locale.**
- [ ] **Wizard labels locale-aware từ `GET /api/pricing/config?lang=`.**
- [ ] **Pass tất cả 13 QA scenarios trên (bao gồm 8 i18n scenarios).**
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
