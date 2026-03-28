# FE Phase F8 Plan — Scale Hardening

> **Tuần:** Phase F8
> **Mục tiêu:** Chuẩn hóa vận hành scale (cache/async/SLO/monitoring) để tăng tải ổn định.
> **Gốc rễ:** Từ FE mock folder — giữ nguyên 100% giao diện
> **Prerequisites:** F0–F7 hoàn thành (F0 hiện đang in_progress)
> **Cập nhật:** 2026-03-28

---

## 0) Pre-work — Có thể làm ngay (không cần chờ F0–F7)

Một số task F8 **hoàn toàn độc lập** với các phase trước. Có thể bắt đầu bất kỳ lúc nào:

### ✅ Có thể bắt đầu ngay
- [ ] **F8-PRE-1:** Tạo `src/lib/slo.ts` — SLO definitions (PUBLIC_API_P95 < 300ms, ADMIN_CRUD_P95 < 500ms, ERROR_RATE < 1%, QUEUE_CLEAR < 15min, FAILED_JOBS < 0.5%, CRITICAL_FLOW_SUCCESS >= 99%)
- [ ] **F8-PRE-2:** Tạo `src/lib/logger.ts` — structured logging, levels, redaction, export stdout + Sentry
- [ ] **F8-PRE-3:** Tạo `src/lib/scaleGate.ts` — checker cho cache strategy, retry policy, async-for-heavy-ops, idempotency key
- [ ] **F8-PRE-4:** Audit dual queue system (Inngest + Jobs song song → decide 1)

---

## 1) Sprint Goal (đo được)

Trong Phase F8, đạt các kết quả bắt buộc:
1. Scale-readiness gates active cho toàn bộ feature P0/P1.
2. Cache + retry + async policy được áp dụng nhất quán.
3. Có dashboard vận hành theo dõi p95/error/queue backlog.
4. Release sau F8 không có blocker incident do perf/regression.

---

## 2) Scope Phase F8

### P0 (bắt buộc)
- [ ] Consolidate Inngest vs Jobs (hiện song song → chọn 1)
- [ ] Chuẩn hóa cache strategy cho endpoint read-heavy (v1 APIs + admin lists)
- [ ] Chuẩn hóa retry policy cho flow critical (FE client.ts + BE route handlers)
- [ ] Tách async jobs khỏi request path cho tác vụ nặng (analytics, reports, exports)
- [ ] Idempotency key cho critical mutations (order creation, LP award/redeem, enrollment)
- [ ] Baseline metrics đo được: p95, error rate, queue backlog
- [ ] Scale gates enforced in CI (dùng scaleGate.ts)

### P1 (quan trọng)
- [ ] Incident quick play cho auth/order/queue (đã có trong runbook — test thực tế)
- [ ] Weekly ops snapshot theo template runbook
- [ ] Dead-letter queue monitoring + cleanup policy
- [ ] Update docs: release checklist + testing playbook + governance policy

### P2 (nếu còn thời gian)
- [ ] Draft kế hoạch tách domain service bằng strangler pattern

---

## 3) Kế hoạch chi tiết theo ngày

### Day 1 — Infrastructure & SLO Baseline

**Owner:** BE Lead + DevOps

#### F8-D1-1: Consolidate Inngest vs Jobs (⚠️ CRITICAL — 2 systems song song)
```
Phát hiện: BE có cả src/lib/inngest/ + src/lib/jobs/ (song song)
Quyết định: Chọn Inngest (enterprise-ready, better observability)
Action:
  1. Audit tất cả jobs hiện có trong cả 2 hệ thống
  2. Migrate jobs từ jobs/ → inngest/
  3. Delete src/lib/jobs/ sau khi migrate xong
  4. Update docs: INNGEST-EVENTS.md
Exit: Chỉ còn Inngest, 0 job trong jobs/
```

#### F8-D1-2: SLO Definitions
```
File: src/lib/slo.ts
Content:
  - PUBLIC_API_P95: < 300ms
  - ADMIN_CRUD_P95: < 500ms
  - ERROR_RATE: < 1%
  - QUEUE_CLEAR: < 15min (normal load)
  - FAILED_JOBS: < 0.5%
  - RETRY_SPIKE: < 30min
  - CRITICAL_FLOW_SUCCESS: >= 99% (auth/order/payment)
Exit: slo.ts tồn tại, được import trong monitoring endpoints
```

#### F8-D1-3: Logger Infrastructure
```
File: src/lib/logger.ts
Content:
  - structured logging (JSON format)
  - levels: debug/info/warn/error
  - Redact sensitive fields (token, password, email)
  - Export to stdout + Sentry
Exit: Logger được dùng trong tất cả API routes critical
```

#### F8-D1-4: Scale Gate Checker
```
File: src/lib/scaleGate.ts
Content:
  - checkCacheStrategy(endpoint) → warn if none defined
  - checkRetryPolicy(endpoint) → warn if none
  - checkAsyncForHeavyOps(endpoint) → warn if sync
  - checkIdempotencyKey(mutation) → warn if none
  - enforceGate() → fail build if critical gaps (P0/P1 scope)
Exit: scaleGate.ts tồn tại, integrate vào CI pipeline
```

---

### Day 2 — Cache & Retry Hardening

**Owner:** BE Lead + FE Lead

#### F8-D2-1: Audit read-heavy endpoints
```
Scope: /api/v1/*, /api/admin/services, /api/admin/projects, /api/admin/team
Check:
  - Có Cache-Control / Expires headers không?
  - TTL bao nhiêu?
  - Cache invalidation khi mutation xảy ra?
Audit output: Danh sách endpoints cần cache
```

#### F8-D2-2: Implement cache strategy cho public APIs
```
Public list (services/projects/team/blog/testimonials):
  - TTL: 60s (stale-while-revalidate)
  - Header: Cache-Control: public, max-age=60, stale-while-revalidate=120
  - Invalidate on: admin create/update/delete
Detail pages (services/:slug, projects/:slug, team/:slug):
  - TTL: 300s
  - Invalidate on: admin update/delete
Dashboard KPIs (overview):
  - TTL: 30s (high volatility)
  - No client-side cache (revalidate on focus)
Exit: Public APIs có cache headers đúng, invalidation documented
```

#### F8-D2-3: Retry policy trong FE API client
```
File: FE/src/api/client.ts
Retry:
  - 3 attempts với exponential backoff (1s → 2s → 4s)
  - Retry on: 408, 429, 500, 502, 503, 504
  - Do NOT retry on: 400, 401, 403, 404, 409
Idempotency key:
  - Generate: crypto.randomUUID() per mutation call
  - Store in sessionStorage để retry cùng key
  - Header: Idempotency-Key: <uuid>
Exit: Retry + idempotency hoạt động trong client.ts
```

#### F8-D2-4: Verify no duplicate side-effects
```
Test: Submit order 2 lần với cùng idempotency key
Expected: Chỉ tạo 1 order trong DB
Check: LP award chỉ 1 lần, notification chỉ 1 lần
Scenarios:
  - Order creation
  - LP redemption
  - Course enrollment
Exit: Idempotency verified cho tất cả critical mutations
```

---

### Day 3 — Async Job Hardening

**Owner:** BE Lead + DevOps

#### F8-D3-1: Audit all async jobs (post-consolidation Inngest)
```
List tất cả jobs trong Inngest
Categorize:
  - Critical (block user flow):
      - Order confirmation emails
      - LP award/redeem
      - Enrollment confirmation
  - Important (realtime feel):
      - Notification fanout
      - Chat message delivery
      - Demo link generation
  - Background (can delay):
      - Analytics aggregation
      - Report generation
      - Email digest
      - Data cleanup
Exit: Inventory đầy đủ của all async jobs với priority level
```

#### F8-D3-2: Implement job priority separation
```
Critical path (high priority queue):
  - Order emails, LP awards, Enrollment confirmations
  - Timeout: 30s
  - Retry: 3x với backoff ngắn
Background path (normal priority):
  - Analytics, reports, digests, cleanup
  - Timeout: 5min
  - Retry: 2x với backoff dài
Exit: Job priority phân biệt rõ trong Inngest config
```

#### F8-D3-3: Dead-letter queue monitoring
```
Check: Các job fail > 3 lần xử lý thế nào?
Setup:
  - Dead-letter event type trong Inngest
  - Monitoring dashboard: DLQ count per job type
  - Alert: DLQ > 10 items → notify BE Lead
  - Cleanup policy: manual review sau 7 ngày
Exit: DLQ visible, có owner, có cleanup policy
```

#### F8-D3-4: Queue health dashboard
```
Widgets needed:
  - Queue depth per job type (real-time)
  - Retry count + fail rate (7-day trend)
  - Average job duration
  - P95 job completion time
Integration: Vercel Analytics / Grafana / custom dashboard
Exit: Queue monitoring visible trong ops dashboard
```

---

### Day 4 — Release Dry Run + Baseline Metrics

**Owner:** Full team

#### F8-D4-1: Full release checklist trên staging
```
Chạy:
  - lint + type-check + build
  - Smoke test: auth + orders + wizard
  - Resilience tests: retry, fallback, cache invalidation
  - Scale gate checker (src/lib/scaleGate.ts)
Exit: Mọi gates pass trên staging
```

#### F8-D4-2: Establish baseline metrics (📊 CRITICAL)
```
Đo (10 endpoints critical):
  - P95 latency: /api/v1/services, /api/v1/projects, /api/admin/orders,
                  /api/admin/dashboard, /api/admin/team, /api/admin/lp,
                  /api/academy/courses, /api/orders/:id, /api/blog-posts, /api/team
  - Error rate baseline (7 ngày data)
  - Queue backlog baseline
  - Critical flow success rate (auth/login, order/create, payment)
Setup: Dashboard snapshot in fe-scale-operating-runbook.md
Exit: Có baseline numbers để so sánh sau mỗi release
```

#### F8-D4-3: Test incident quick plays
```
Scenario A: Auth lỗi diện rộng
  → Verify quick play steps trong fe-scale-operating-runbook.md hoạt động
Scenario B: Order flow chậm
  → Verify cache fallback hoạt động, analytics tách khỏi sync path
Scenario C: Queue backlog tăng
  → Verify dead-letter handling, job priority separation
Exit: 3 incident plays đã test thực tế trên staging
```

#### F8-D4-4: Capacity planning baseline
```
File: src/lib/capacity.ts (template)
Content:
  - Team capacity calculator (person-days)
  - Dependency tracker (BE/FE/QA/Design/External)
  - Risk buffer calculator (10-20%)
  - Weekly output planner
  - Sprint capacity summary
Exit: Capacity tool sẵn dùng từ F9 trở đi
```

---

### Day 5 — Ops Handover + Documentation

**Owner:** FE Lead + BE Lead

#### F8-D5-1: Finalize Scale Operating Runbook
```
Update fe-scale-operating-runbook.md:
  - Baseline metrics (từ D4-2)
  - Dashboard links (actual)
  - SLO thresholds (from slo.ts)
  - Escalation contacts
  - Incident quick plays đã test
Setup:
  - Weekly ops snapshot schedule (every Monday 9am)
  - Runbook version in footer
Exit: Runbook active, team biết cách dùng, versioned
```

#### F8-D5-2: Update all linked docs
```
fe-release-checklist.md:
  - Add SLO tracking columns (baseline vs current)
  - Add scale gate enforcement result log
fe-testing-playbook.md:
  - Add specific LOOP resilience scenarios (order retry, LP idempotency)
  - Add scale-resilience test pack vào Section 6
fe-risk-register-template.md:
  - Verify SLO/KPI affected column đầy đủ
fe-governance-policy.md:
  - Update SLA với actual numbers từ slo.ts
Exit: Tất cả docs nhất quán với F8 baseline, không mâu thuẫn
```

#### F8-D5-3: Scale gates enforcement in CI
```
Integrate src/lib/scaleGate.ts vào CI pipeline
CI fail nếu:
  - Critical endpoint (P0/P1) không có cache strategy → warn
  - Mutation không có idempotency key → warn
  - Heavy operation (>1s) chạy sync (không async) → fail
Exit: Scale gates automated trong CI, CI fail = release blocked
```

#### F8-D5-4: Go/No-Go review + F8 Retro
```
Go/No-Go checklist với actual F8 results
Retro:
  - What went well: Consolidation queue, SLO definitions
  - What didn't: DLQ cleanup policy, baseline metrics timing
  - Action items: F9 improvements
Update:
  - fe-phase-status-log.md → F8 completed
  - fe-roadmap.md → Phase Status Tracker updated
Exit: F8 closed, plan cho F9 (nếu cần) documented
```

---

## 4) Metrics bắt buộc theo dõi

### Endpoint SLO
- Public API p95 < 300ms (cached path)
- Admin CRUD p95 < 500ms
- Error rate < 1%

### Queue SLO
- Queue backlog clear trong < 15 phút (normal load)
- Failed jobs < 0.5%
- Retry spike không kéo dài > 30 phút

### UX SLO
- Critical flow success rate (auth/order/payment) >= 99%
- Không có blocker bug mở ở release candidate

---

## 5) API/Endpoint Checklist F8

### Scale Infrastructure
- [ ] `src/lib/slo.ts` — SLO definitions ✅
- [ ] `src/lib/logger.ts` — Structured logger ✅
- [ ] `src/lib/scaleGate.ts` — Scale gate checker ✅
- [ ] `src/lib/capacity.ts` — Capacity planning tool ✅

### Queue Consolidation
- [ ] Audit Inngest functions inventory
- [ ] Audit Jobs functions inventory
- [ ] Migrate Jobs → Inngest (if Inngest wins)
- [ ] Delete src/lib/jobs/
- [ ] Job priority separation (critical vs background)

### Cache
- [ ] Public list APIs: cache headers 60s TTL
- [ ] Detail APIs: cache headers 300s TTL
- [ ] Admin KPIs: cache headers 30s TTL
- [ ] Cache invalidation on mutation documented

### Retry & Idempotency
- [ ] FE client.ts: retry 3x exponential backoff
- [ ] FE client.ts: idempotency key header
- [ ] Order creation: idempotency verified
- [ ] LP award/redeem: idempotency verified
- [ ] Enrollment: idempotency verified

### Monitoring
- [ ] Queue depth per job type dashboard
- [ ] DLQ monitoring + alert
- [ ] Baseline metrics documented
- [ ] Scale gate CI enforcement

---

## 6) Definition of Done (Phase F8)

- [ ] Consolidate queue → chỉ còn 1 system (Inngest)
- [ ] Cache strategy enforced cho tất cả read-heavy endpoints
- [ ] Retry + idempotency hoạt động trong FE client
- [ ] Scale gates automated trong CI
- [ ] Baseline metrics đo được và documented
- [ ] Queue health visible trong dashboard
- [ ] DLQ có monitoring + cleanup policy
- [ ] Ops runbook active với baseline numbers
- [ ] Tất cả docs updated (release checklist + testing playbook + governance)
- [ ] F8 retro completed, action items captured
- [ ] fe-roadmap.md Phase Status Tracker updated → F8 completed

---

## 7) Pre-work Dependencies

F8 có 4 task có thể **bắt đầu ngay** (PRE-1 → PRE-4), không phụ thuộc F0–F7:

```
Can start immediately:
├── F8-PRE-1: src/lib/slo.ts
├── F8-PRE-2: src/lib/logger.ts
├── F8-PRE-3: src/lib/scaleGate.ts
└── F8-PRE-4: Audit + consolidate Inngest vs Jobs

Requires F0–F7 completion:
└── All Day 1–5 tasks (cần BE endpoints thực tế để đo metrics)
```

---

## 8) Rủi ro & Phương án

| Rủi ro | Impact | Prob | Mitigation |
|---|---|---|---|
| Consolidate Inngest vs Jobs mất thời gian nhiều hơn dự kiến | High | Medium | Pre-work audit Day 0, migration có deadline |
| Baseline metrics khó đo khi hệ thống chưa có traffic thật | Medium | High | Dùng synthetic benchmarks, đo từ staging |
| Scale gates fail CI quá nhiều → team bypass | Medium | Medium | Phân biệt warn vs fail, chỉ fail P0 gaps |
| DLQ tích lũy nhiều trước khi monitoring ready | Medium | Low | Manual cleanup trước khi monitoring bật |

---

## 9) Liên kết
- `.claude/rules/fe-scale-operating-runbook.md`
- `.claude/rules/fe-release-checklist.md`
- `.claude/rules/fe-testing-playbook.md`
- `.claude/rules/fe-risk-register-template.md`
- `.claude/rules/fe-governance-policy.md`
- `src/lib/slo.ts` (tạo mới)
- `src/lib/logger.ts` (tạo mới)
- `src/lib/scaleGate.ts` (tạo mới)
- `src/lib/capacity.ts` (tạo mới)
