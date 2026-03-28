# FE Production Go-Live Plan — LOOP Solutions

> **Mục tiêu:** Kế hoạch hoàn thiện và phát hành production an toàn cho FE-first roadmap LOOP.
> **Cập nhật:** 2026-03-28

---

## 1) Scope Go-Live

Áp dụng cho toàn bộ flow critical trước production:
- Auth (login/me/logout + route guards)
- Public pages (landing/services/portfolio/blog/contact)
- Booking wizard + order lifecycle
- Customer portal (orders/invoices/lp)
- Admin core operations (orders/members/services/portfolio)

Không áp dụng cho:
- thử nghiệm UX nhỏ không ảnh hưởng business flow
- module chưa nằm trong scope release freeze

---

## 2) Go-Live phases

## G0 — Pre-Go-Live Foundation (3–5 ngày)

- [ ] Chốt environment matrix (local/staging/prod)
- [ ] Chốt secrets/env injection qua CI/CD
- [ ] CI gates chạy ổn định (lint/type-check/build/tests)
- [ ] Docker images tối ưu + security scan pass
- [ ] Rollback owner + rollback playbook đã xác nhận

**Exit criteria G0:** staging deploy thành công >= 3 lần liên tiếp.

---

## G1 — Functional Completion (1–2 tuần)

- [ ] Hoàn tất F0 (auth + api client)
- [ ] Hoàn tất F1 (public pages wired BE)
- [ ] Hoàn tất F2 (wizard + orders)
- [ ] Hoàn tất F5 scope tối thiểu customer portal
- [ ] Hoàn tất F6 admin core tabs
- [ ] Không để mock leak vào production path

**Exit criteria G1:** critical journeys pass end-to-end trên staging.

---

## G2 — Hardening & Scale Readiness (5–7 ngày)

- [ ] Áp dụng scale-readiness gates (retry/cache/async/monitoring)
- [ ] Chạy regression + resilience test pack
- [ ] Bật SLO dashboard (p95/error/queue)
- [ ] Blocker bug = 0
- [ ] Risk score >= 6 đều có mitigation owner + ETA

**Exit criteria G2:** baseline ổn định 2 vòng test liên tiếp.

---

## G3 — Release Execution (2 ngày)

### T-2
- [ ] Freeze scope
- [ ] Chốt release candidate
- [ ] QA sign-off draft

### T-1
- [ ] Rehearsal deploy staging (full)
- [ ] Go/No-Go meeting
- [ ] Final rollback confirmation

### T (Release day)
- [ ] Deploy production (rolling/blue-green)
- [ ] Post-deploy smoke 60 phút
- [ ] Theo dõi metrics 0–24h

**Exit criteria G3:** production stable, không SEV-1/SEV-2.

---

## 3) Mandatory Go-Live Criteria

Tất cả điều kiện dưới đây phải đạt:
- [ ] Lint pass
- [ ] Type-check pass
- [ ] Build pass
- [ ] Contract mismatch open = 0 (scope release)
- [ ] Critical E2E pass (auth/order/payment/admin/customer)
- [ ] Security gates pass
- [ ] Observability live (error rate/p95/queue)
- [ ] Rollback test đã chạy

---

## 4) CI/CD requirements

## CI (PR)
- [ ] Changed-files aware pipeline (FE-only / BE-only / full)
- [ ] Quality gates bắt buộc
- [ ] Test gates theo risk scope
- [ ] Container scan (nếu build image)

## CD (Staging)
- [ ] Auto deploy sau merge branch release candidate
- [ ] Auto smoke checks
- [ ] Notify #release-room

## CD (Production)
- [ ] Trigger theo tag release
- [ ] Manual approval gate (PO + QA + Tech Lead)
- [ ] Healthcheck + metric watch window

---

## 5) Docker flow requirements

## BE image
- [ ] Multi-stage build
- [ ] Runtime image tối thiểu
- [ ] Healthcheck endpoint
- [ ] No secrets baked into image

## FE image
- [ ] Build stage + static runtime stage
- [ ] Asset caching headers
- [ ] Gzip/Brotli enabled (nếu infra hỗ trợ)

## Tagging
- [ ] `:sha` immutable
- [ ] `:staging` / `:prod` moving tags
- [ ] `:vX.Y.Z` release tag

---

## 6) Monitoring checklist (0–24h)

- [ ] Error rate theo domain
- [ ] P95 latency endpoint critical
- [ ] Auth failure spike
- [ ] Queue backlog/retry/fail
- [ ] User-reported incidents từ support

Escalate ngay nếu:
- Error rate > 1%
- P95 critical endpoint vượt ngưỡng liên tục 15 phút
- Queue backlog không giảm > 30 phút

---

## 7) Rollback criteria

Rollback ngay nếu có 1 trong các điều kiện:
- Auth flow lỗi diện rộng
- Order/payment lifecycle lỗi critical
- API error spike gây ảnh hưởng business flow
- Production SEV-1/SEV-2 mở > 15 phút chưa có workaround

Rollback execution:
1. Switch về image/tag ổn định gần nhất
2. Verify health endpoints
3. Run critical smoke pack
4. Announce status + open postmortem ticket

---

## 8) Roles & ownership

- **Release Owner:** điều phối tổng thể release window
- **FE Lead:** FE health, UI flow integrity
- **BE Lead:** API/DB/perf stability
- **QA Lead:** sign-off functional + regression
- **DevOps:** deployment + rollback execution
- **PO:** final Go/No-Go business approval

---

## 9) Go/No-Go template

```md
## Go/No-Go Decision

- Release version:
- Date/time:
- Scope freeze confirmed: yes/no
- Blocker bugs: <count>
- Contract mismatch open: <count>
- Quality gates: pass/fail
- Security gates: pass/fail
- Scale gates: pass/fail
- Rollback ready: yes/no

Decision: GO / NO-GO
Approvers: PO / FE Lead / BE Lead / QA Lead / DevOps
Notes:
```

---

## 10) Liên kết
- `.claude/rules/fe-release-checklist.md`
- `.claude/rules/fe-release-runbook.md`
- `.claude/rules/fe-scale-operating-runbook.md`
- `.claude/rules/fe-risk-register-template.md`
- `.claude/rules/fe-testing-playbook.md`
- `.claude/rules/fe-roadmap.md`
