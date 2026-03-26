# FE Roadmap (2026) — LOOP Solutions

> **Mục tiêu:** Lộ trình triển khai FE mới bám sát nghiệp vụ, tích hợp API thật, sẵn sàng mở rộng mobile.
> **Cập nhật:** 2026-03-26

---

## 1) Hiện trạng
- FE hiện tại (`d:/LOOP_COMPANY/LOOP/FE`) là bản mock UI/UX đầy đủ, chưa gọi API thật.
- BE (`d:/LOOP_COMPANY/LOOP`) là Next.js 15 API-only với 198 endpoints.
- Một số nghiệp vụ nâng cao cần bổ sung/hoàn thiện thêm ở BE (effects, quest/event, media booking, tax automation...).

---

## 2) Nguyên tắc roadmap
1. **Business-first**: đi theo user flow quan trọng trước.
2. **Contract-first**: FE chỉ tích hợp theo `docs/API-CONTRACT.md`.
3. **Performance-first**: pagination, caching, lazy load, tối ưu ảnh.
4. **Scalable-first**: logic nặng tách service khi cần.
5. **Mobile-ready**: chuẩn response/error/auth cho web + mobile dùng chung.

---

## 3) Lộ trình theo phase

## Phase 0 — Foundation (Tuần 1-2)
- Chuẩn hóa FE foundation (auth, API client, loading/error conventions).
- Thiết lập base để thay mock bằng API thật theo từng module.
- Hoàn thiện các endpoint nền tảng đang thiếu để tránh block tích hợp.

**Exit criteria:** login/me/logout hoạt động, FE gọi API thật ổn định.

## Phase 1 — Core business integration (Tuần 3-5)
- Public: services, portfolio, team, blog, contact.
- Booking wizard 8 bước: tính giá + tạo quote/order.
- Admin core: orders, services, portfolio, members, clients, blog, overview.

**Exit criteria:** flow public -> đặt dịch vụ -> admin xử lý chạy end-to-end.

## Phase 2 — LP + Effects + Quest/Event (Tuần 6-8)
- LP earning/redeem/leaderboard.
- Effects theo rank + global toggle + quản trị theo thành viên.
- Quest/Event vận hành gamification.

**Exit criteria:** LP economy chạy thực tế, rank/effect unlock đúng nghiệp vụ.

## Phase 3 — Academy + Realtime + Media (Tuần 9-12)
- Academy đầy đủ: enrollment, progress, video gate, certificate.
- Realtime chat/notification cho order lifecycle.
- Media booking lifecycle từ booking đến delivery.

**Exit criteria:** customer portal xử lý học + dự án + media có realtime.

## Phase 4 — Analytics + Tax automation (Tuần 13-16)
- Dashboard analytics đa chiều (revenue/funnel/team/LP).
- Rule-based tax automation + report định kỳ.
- Tăng quan sát vận hành (audit/metrics).

**Exit criteria:** hệ thống có báo cáo nghiệp vụ + thuế tự động mức production.

## Phase 5 — Mobile readiness (Tuần 17-20)
- Chuẩn API cho mobile/PWA.
- Push notification, cache/offline strategy.
- Chuẩn bị bản dùng thử Android (APK/PWA installable).

**Exit criteria:** có bản mobile trial dùng chung backend contract.

---

## 4) Ưu tiên thực thi tuần này
1. Kết nối auth FE với BE thật (login/me/logout).
2. Tích hợp Services + Portfolio + Blog bằng API thật.
3. Bắt đầu wizard integration (calculate + create order).
4. Chuẩn hóa lỗi/loading/empty state cho toàn FE.

---

## 5) Liên kết
- `docs/API-CONTRACT.md`
- `.claude/rules/fe-delivery-process.md`
- `.claude/rules/fe-architecture-microservices.md`
