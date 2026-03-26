# FE Architecture & Microservices Boundary — LOOP Solutions

> **Mục tiêu:** Chuẩn hóa kiến trúc tích hợp FE với BE hiện tại và định hướng tách microservice cho scale.
> **Cập nhật:** 2026-03-26

---

## 1) Kiến trúc mục tiêu

## FE layer
- FE tiêu thụ API theo contract thống nhất.
- Server-state tách khỏi UI-state (cache/revalidate, retry, pagination).
- Shared design tokens và component conventions đồng nhất web/mobile.

## Core API layer (hiện tại)
- Auth/RBAC
- Orders/Services/Portfolio/Blog
- Academy nền tảng
- CRM và các module admin cơ bản

## Specialized services (tách khi tải tăng)
1. **Pricing/Tax Engine**
   - Pricing wizard 8 bước
   - Rule engine cho multiplier/extras/tax
2. **LP Service**
   - LP reward/redeem/transfer
   - Leaderboard + quest/event
3. **Analytics Service**
   - KPI dashboard, funnel, revenue reports
   - Batch/report jobs
4. **Media Service**
   - Media booking
   - Upload/process/delivery assets

---

## 2) Vì sao tách service

- Tránh logic nặng (analytics/tax/media processing) ảnh hưởng order flow chính.
- Cho phép scale độc lập theo tải từng nghiệp vụ.
- Giảm va chạm release giữa các team.
- Dễ chuẩn hóa SLA theo domain.

---

## 3) Boundary đề xuất

## Core API giữ lại
- Auth/permission/session
- CRUD chính: orders/services/projects/blog
- Các endpoint đồng bộ trực tiếp với trải nghiệm người dùng cốt lõi

## Pricing/Tax service
- `/pricing/*`, `/quote/*`, `/tax/*`
- Tách rule theo version để dễ điều chỉnh theo pháp lý

## LP service
- `/lp/*`, `/leaderboard/*`, `/quest/*`, `/event/*`
- Đảm bảo transaction integrity cho điểm thưởng

## Analytics service
- `/analytics/*`, `/reports/*`
- Chạy read-heavy, async jobs, không block request online

## Media service
- `/media-booking/*`, `/media-assets/*`
- Tối ưu pipeline upload/process/delivery

---

## 4) Performance & resource strategy

## FE
- Chỉ lấy dữ liệu cần thiết theo trang.
- Pagination bắt buộc cho list lớn.
- Lazy load chart/editor/media preview.
- Caching hợp lý để giảm request lặp.

## BE
- Prisma query dùng select rõ ràng.
- Index cho trường filter/sort phổ biến.
- Tác vụ nặng dùng background jobs.
- Service analytics/media tách runtime khi cần.

---

## 5) Mobile readiness requirements

- Chuẩn response shape thống nhất (`data`, `pagination`, `error`).
- Chuẩn error codes để app xử lý UX ổn định.
- Auth flow có chiến lược refresh token rõ ràng.
- Notification/event schema dùng chung web + mobile.
- Hạn chế response dư để tiết kiệm băng thông mobile.

---

## 6) Chỉ số kiến trúc cần theo dõi

- P95 latency theo từng domain endpoint.
- Error rate theo service.
- Throughput order flow vs analytics load.
- DB query time + slow query counts.
- Queue backlog cho jobs nặng.

---

## 7) Quy tắc migration lên microservice

1. Tách theo domain có ranh giới nghiệp vụ rõ.
2. Giữ API contract backward-compatible trong giai đoạn chuyển tiếp.
3. Chuyển dần theo strangler pattern (route-by-route).
4. Đo hiệu năng trước/sau khi tách để xác minh hiệu quả.

---

## 8) Liên kết
- `.claude/rules/fe-roadmap.md`
- `.claude/rules/fe-delivery-process.md`
- `docs/API-CONTRACT.md`
- `docs/DB-PERFORMANCE.md`
