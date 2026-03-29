# FE Architecture & Scale Boundary — LOOP Solutions

> **Mục tiêu:** Chuẩn hóa kiến trúc FE↔BE để scale bền vững, không tách microservice quá sớm, nhưng sẵn sàng tách theo domain khi cần.
> **Cập nhật:** 2026-03-28

---

## 1) Target architecture (hiện tại → tương lai)

## Giai đoạn hiện tại: Modular Monolith (khuyến nghị giữ)
- FE: Vite + React tiêu thụ API contract thống nhất.
- BE: Next.js API route theo domain module (auth/orders/academy/lp/notifications/analytics/media).
- DB: PostgreSQL/Neon + Prisma.
- Cache/Queue: thêm dần theo nhu cầu (Redis + job runner).

## Giai đoạn tương lai: Domain Services (chỉ tách khi có tín hiệu)
- Pricing/Tax service
- LP service
- Analytics service
- Media service

---

## 2) Kiến trúc vận hành bắt buộc (baseline)

1. **Contract-first:** FE chỉ tích hợp endpoint đã chốt request/response/status.
2. **Single API client:** mọi call FE đi qua shared API layer.
3. **Server-state tách UI-state:** cache/invalidation/retry độc lập với UI.
4. **Async-first cho tác vụ nặng:** report, media process, notification fanout không block request online.
5. **Observability-first:** log/metrics/traces là điều kiện bắt buộc để scale.

---

## 3) Domain boundary (monolith nội bộ)

## Core domains (giữ trong monolith)
- Auth/RBAC/session
- Orders/services/projects/blog
- Academy cơ bản
- Admin CMS CRUD

## Heavy domains (ưu tiên tách async trước, tách service sau)
- Pricing/tax rules
- LP rewards/redeem/leaderboard/quests
- Analytics/reporting
- Media booking/upload/process/delivery

---

## 4) Performance & resource strategy

## FE
- Pagination bắt buộc cho list lớn.
- Lazy-load module nặng (charts/editor/media preview).
- Chỉ fetch dữ liệu cần cho màn hình hiện tại.
- Invalidate cache theo scope module, không invalidate toàn cục.

## BE
- Prisma query dùng `select/include` tối thiểu.
- Bắt buộc index cho filter/sort phổ biến.
- Background jobs cho xử lý nặng.
- Read-heavy endpoint có cache TTL rõ ràng.

---

## 5) Cache strategy (scale readiness)

- Public list APIs: cache ngắn (TTL 30-120s).
- Detail pages: cache theo id/slug.
- Dashboard KPI: cache ngắn + manual refresh.
- Invalidate theo domain event (ví dụ update service → invalidate services list/detail).
- Không cache dữ liệu nhạy cảm auth/session theo kiểu public cache.

---

## 6) Async job strategy

Tác vụ bắt buộc chạy nền:
- Analytics aggregation
- Revenue/report export
- Notification fanout đa kênh
- Media processing/transcoding
- LP batch sync/award jobs

Yêu cầu bắt buộc:
- idempotency key
- retry policy + dead-letter handling
- job metrics: queue depth, retry count, fail rate

---

## 7) SLO/metrics phải theo dõi

- P95 latency theo domain endpoint
- Error rate theo endpoint/group
- DB query p95 + slow query count
- Queue backlog + time-to-drain
- Throughput order flow vs analytics/media load

Ngưỡng gợi ý:
- Public API p95 < 300ms (cached path)
- Admin CRUD p95 < 500ms
- Error rate < 1%

---

## 8) Khi nào được tách microservice

Chỉ tách khi thỏa ít nhất 2 điều kiện:
1. Domain có tải cao độc lập và ảnh hưởng core flow.
2. Chu kỳ release domain đó gây nghẽn team khác.
3. Cần SLA khác biệt so với core API.
4. Queue/backlog domain đó tăng kéo dài.

Ưu tiên thứ tự tách:
1) Pricing/Tax → 2) LP → 3) Analytics → 4) Media

---

## 9) Migration rules (strangler pattern)

1. Route-by-route, không big-bang rewrite.
2. Giữ backward-compatible contract trong giai đoạn chuyển tiếp.
3. Dùng adapter ở FE khi cần tạm thời, có expiry plan.
4. Đo trước/sau migration bằng cùng KPI.

---

## 10) Liên kết
- `.claude/rules/fe-roadmap.md`
- `.claude/rules/fe-delivery-process.md`
- `.claude/rules/fe-governance-policy.md`
- `.claude/rules/fe-scale-operating-runbook.md`
- `docs/API-CONTRACT.md`
- `docs/DB-PERFORMANCE.md`
