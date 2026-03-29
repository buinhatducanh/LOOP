# FE Scale Operating Runbook — LOOP Solutions

> **Mục tiêu:** Runbook vận hành thực chiến khi hệ thống tăng tải, đảm bảo release ổn định và không phá vỡ core flow.
> **Cập nhật:** 2026-03-28

---

## 1) Khi nào kích hoạt runbook này

Kích hoạt ngay nếu có một trong các dấu hiệu:
- P95 API latency tăng > 30% so baseline trong 2 ngày liên tiếp
- Error rate > 1% ở endpoint critical
- Queue backlog tăng liên tục > 30 phút
- Incident SEV-1/SEV-2 liên quan auth/order/payment
- Team bắt đầu chuẩn bị tách domain service

---

## 2) Operating model theo chu kỳ

## Daily (15-20 phút)
1. Check dashboard: error rate, auth failures, P95 critical endpoints
2. Check queue: backlog, retry count, failed jobs
3. Check release tickets: có contract mismatch blocker không
4. Check top 3 risks mở (score >= 6)

## Weekly (45 phút)
1. Review KPI tuần: delivery/quality/performance/ops
2. Review risk register + escalation items
3. Review cache/retry/async health cho module mới release
4. Chốt capacity và cut-line cho tuần kế

## Release window
1. Freeze scope
2. Run release checklist (including scale gates)
3. Deploy staging + smoke
4. Go/No-Go
5. Deploy prod + monitor 60 phút đầu

---

## 3) SLO/SLI baseline cần theo dõi

## Endpoint SLO
- Public API p95 < 300ms (cached path)
- Admin CRUD p95 < 500ms
- Error rate < 1%

## Queue SLO
- Queue backlog clear trong < 15 phút (normal load)
- Failed jobs < 0.5%
- Retry spike không kéo dài > 30 phút

## UX SLO
- Critical flow success rate (auth/order/payment) >= 99%
- Không có blocker bug mở ở release candidate

---

## 4) Weekly execution checklist (copy/paste)

### A. Contract & API health
- [ ] Endpoint mới có contract sign-off
- [ ] Không còn mismatch open ở scope tuần
- [ ] Adapter tạm thời có expiry plan

### B. Performance health
- [ ] P95 endpoint critical trong ngưỡng
- [ ] Request count/trang không tăng bất thường
- [ ] Bundle size thay đổi trong ngưỡng chấp nhận

### C. Cache & retry health
- [ ] Read-heavy endpoint có cache strategy rõ
- [ ] Mutation có invalidation đúng scope
- [ ] Retry không gây duplicate side-effects

### D. Async job health
- [ ] Tác vụ nặng chạy queue, không block request online
- [ ] Queue depth/retry/failure được theo dõi
- [ ] Dead-letter handling có owner

### E. Security & permission
- [ ] RBAC guard đúng role/department
- [ ] Không lộ dữ liệu nhạy cảm
- [ ] Rate limit vẫn hoạt động

### F. Release readiness
- [ ] Lint/type-check/build pass
- [ ] Smoke/regression pass
- [ ] Rollback plan rõ ràng

---

## 5) Incident quick play

## Nếu auth lỗi diện rộng
1. Kiểm tra cookie/session backend
2. Rollback build mới nhất nếu cần
3. Mở comms channel + update mỗi 30 phút

## Nếu order flow chậm
1. Tách nhanh analytics calls khỏi synchronous path
2. Bật cache ngắn cho read path
3. Giảm tải non-critical widgets

## Nếu queue backlog tăng
1. Scale worker/concurrency
2. Tạm tắt job không critical
3. Requeue có kiểm soát, theo dõi fail spikes

---

## 6) Quy tắc quyết định tách service

Chỉ tách domain service khi:
- Có số liệu chứng minh bottleneck kéo dài
- Có owner vận hành riêng cho domain
- Có kế hoạch migration route-by-route
- Có backward-compatible contract trong giai đoạn chuyển tiếp

Thứ tự ưu tiên tách:
1. Pricing/Tax
2. LP
3. Analytics
4. Media

---

## 7) Ownership map (runbook)

- **FE Lead:** health FE integration, cache/query behavior
- **BE Lead:** endpoint latency/error/DB query health
- **DevOps:** infra metrics, queue runtime, release execution
- **QA Lead:** smoke/regression gates
- **PO:** scope control + priority trade-off

---

## 8) Template báo cáo tuần ngắn

```md
## Scale Ops Weekly Snapshot

- Status: on_track / at_risk / delayed
- Top incidents this week:
- P95 critical endpoints:
- Error rate:
- Queue backlog trend:
- Open high risks (score >= 6):
- Decisions needed:
- Plan next week:
```

---

## 9) Liên kết
- `.claude/rules/fe-governance-policy.md`
- `.claude/rules/fe-delivery-process.md`
- `.claude/rules/fe-release-checklist.md`
- `.claude/rules/fe-testing-playbook.md`
- `.claude/rules/fe-risk-register-template.md`
- `.claude/rules/fe-architecture-microservices.md`
