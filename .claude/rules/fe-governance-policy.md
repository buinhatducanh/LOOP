# FE Governance Policy — LOOP Solutions

> **Mục tiêu:** Governance chuẩn cho FE/BE integration: rõ quyết định, SLA, change control, scale-readiness.
> **Cập nhật:** 2026-03-28

---

## 1) Scope

Áp dụng cho toàn bộ thay đổi liên quan:
- FE roadmap và API integration
- release/vận hành hàng tuần
- kiến trúc scale (cache/async jobs/observability)

Team áp dụng: PO, Design, FE, BE, QA, DevOps, Support.

---

## 2) Governance principles

1. **Business alignment trước kỹ thuật**
2. **Contract-first delivery**
3. **Quality gate bắt buộc**
4. **Risk transparency (owner + ETA)**
5. **Controlled change (CR bắt buộc khi đổi scope)**
6. **Operate-to-scale:** mọi feature mới phải nêu rõ cache/retry/monitoring

---

## 3) Decision rights

- **PO:** scope/priority/trade-off business
- **FE/BE Tech Lead:** giải pháp kỹ thuật trong phạm vi contract
- **QA Lead:** quality sign-off
- **DevOps Lead:** release window/rollback

Khi xung đột:
1) ưu tiên an toàn dữ liệu và uptime
2) escalate PO + Tech Lead + QA Lead

---

## 4) SLA vận hành

## Blocker SLA
- P0: phản hồi <= 30 phút, workaround <= 4 giờ
- P1: phản hồi <= 2 giờ, xử lý <= 1 ngày
- P2: phản hồi <= 1 ngày

## PR Review SLA
- P0/P1: vòng 1 <= 4 giờ làm việc
- P2: vòng 1 <= 1 ngày làm việc

## Contract change SLA
- Minor: <= 1 ngày
- Major: <= 2 ngày + update docs bắt buộc

## Incident comms SLA
- SEV-1: update mỗi 30 phút
- SEV-2: update mỗi 1 giờ

---

## 5) Scale-readiness gate (mới)

Mỗi feature P0/P1 trước merge phải có:
- [ ] endpoint owner rõ ràng
- [ ] retry policy rõ (client/server)
- [ ] cache strategy rõ (nếu read-heavy)
- [ ] async handling cho tác vụ nặng
- [ ] metric theo dõi sau release
- [ ] rollback path cụ thể

Nếu thiếu 1 trong các mục trên → **không được đóng Done**.

---

## 6) Change control policy

Thay đổi ngoài sprint scope:
1. Tạo CR
2. Đánh giá impact timeline/quality/dependency
3. PO + Tech Lead + QA approve/reject
4. Nếu approve: cập nhật roadmap + weekly plan + release scope

### CR tối thiểu phải có
- CR ID, requester, reason
- business impact
- technical impact
- risk impact
- decision + approvers

---

## 7) Definition of Ready (DoR)

Task chỉ được bắt đầu khi:
- [ ] AC rõ
- [ ] API contract rõ (hoặc BE action item rõ)
- [ ] design spec tối thiểu
- [ ] owner + estimate + dependency
- [ ] monitoring expectation (metric nào sẽ theo dõi)

---

## 8) Definition of Done (Governance)

Deliverable chỉ đóng khi:
- [ ] đạt AC và quality gates
- [ ] không còn blocker bug mở
- [ ] docs liên quan cập nhật
- [ ] có test/verify evidence
- [ ] có post-release metric check plan

---

## 9) Audit cadence

- Hàng tuần: status + risk + release readiness
- Hàng tháng: compliance SLA + quality gate compliance
- Hàng quý: review kiến trúc + quyết định tách domain/service

---

## 10) Non-compliance handling

Nếu bypass process (skip review/test/contract/scale gate):
1. Ghi incident process
2. Đánh giá impact
3. Tạo corrective action vào sprint kế tiếp
4. Cập nhật guideline + training lại nếu cần

---

## 11) Liên kết
- `.claude/rules/fe-delivery-process.md`
- `.claude/rules/fe-release-checklist.md`
- `.claude/rules/fe-risk-register-template.md`
- `.claude/rules/fe-architecture-microservices.md`
- `.claude/rules/fe-scale-operating-runbook.md`
- `.claude/rules/fe-scale-operating-runbook.md`
