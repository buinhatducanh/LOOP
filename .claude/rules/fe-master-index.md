# FE Master Index — LOOP Solutions

> **Mục đích:** 1 điểm vào duy nhất cho toàn bộ tài liệu roadmap, process, architecture, execution, governance và reporting của FE.
> **Cập nhật:** 2026-03-27 (updated with week 13)

---

## A) Core FE Rules

1. `./fe-roadmap.md`
   - Lộ trình triển khai theo phase (foundation -> mobile readiness).

2. `./fe-delivery-process.md`
   - Quy trình PO -> Design -> Dev -> QA -> Release.

3. `./fe-architecture-microservices.md`
   - Boundary kiến trúc, định hướng tách service, nguyên tắc hiệu năng.

4. `./fe-sprint-template.md`
   - Template sprint chuẩn tuần (planning/execution/QA/release).

---

## B) Weekly Execution Plans (12 tuần)

- `./fe-week-01-plan.md` — Auth + public modules integration
- `./fe-week-02-plan.md` — Booking wizard + quote/order flow
- `./fe-week-03-plan.md` — Admin core tabs integration
- `./fe-week-04-plan.md` — LP economy baseline + leaderboard + effects nền tảng
- `./fe-week-05-plan.md` — Academy core flow thật
- `./fe-week-06-plan.md` — Chat + notification realtime baseline
- `./fe-week-07-plan.md` — Media booking integration
- `./fe-week-08-plan.md` — Effects/Quest/Event hoàn thiện
- `./fe-week-09-plan.md` — Analytics dashboard baseline
- `./fe-week-10-plan.md` — Tax/invoice/payment consistency
- `./fe-week-11-plan.md` — Performance optimization sprint
- `./fe-week-12-plan.md` — Regression + release hardening
- `./fe-week-13-plan.md` — i18n hardening + API locale coverage + CJK font rollout
- `./fe-week-13-plan.md` — i18n hardening + API locale coverage + CJK font rollout

### i18n Expansion Plan (5 tuần bổ sung)

- `./fe-i18n-implementation-plan.md` — Triển khai i18n 5 ngôn ngữ (VI–EN–JA–KO–ZH), Tiered loading, CMS multilingual, SEO hreflang, translation workflow

---

## C) Reporting & Control Templates

- `./fe-weekly-status-report.md` — template báo cáo tuần (Done/Blocked/Risk/KPI/Next week)
- `./fe-risk-register-template.md` — sổ đăng ký rủi ro chuẩn (risk matrix + mitigation)
- `./fe-release-checklist.md` — checklist phát hành chuẩn (engineering/QA/security/perf/rollback)
- `./fe-release-runbook.md` — runbook thao tác release staging -> production
- `./fe-kpi-scorecard-template.md` — bảng KPI delivery/quality/performance/ops
- `./fe-capacity-planning-template.md` — template hoạch định năng lực sprint
- `./fe-retrospective-template.md` — template retrospective
- `./fe-data-contract-checklist.md` — checklist xác minh data contract FE<->BE before build/release

---

## D) Governance & Operations

- `./fe-governance-policy.md` — chính sách governance (RACI/SLA/escalation/change control)
- `./fe-change-request-template.md` — mẫu Change Request chuẩn
- `./fe-incident-playbook.md` — playbook xử lý sự cố
- `./fe-communication-plan.md` — kế hoạch giao tiếp liên team
- `./fe-environment-matrix.md` — ma trận môi trường và biến cấu hình
- `./fe-feature-flag-policy.md` — policy quản trị feature flags
- `./fe-api-integration-playbook.md` — playbook tích hợp API thật cho FE
- `./fe-code-review-checklist.md` — checklist review code FE
- `./fe-security-review-checklist.md` — checklist security review FE
- `./fe-dependency-policy.md` — policy quản trị dependencies
- `./fe-testing-playbook.md` — playbook testing theo rủi ro
- `./fe-adr-template.md` — template ghi nhận quyết định kiến trúc (ADR)
- `./fe-onboarding-guide.md` — hướng dẫn onboarding thành viên mới
- `./fe-handover-checklist.md` — checklist bàn giao dev/QA/ops
- `./fe-doc-maintenance-policy.md` — chính sách bảo trì tài liệu FE
- `./fe-branching-strategy.md` — chiến lược branching/merge
- `./fe-backlog-triage-policy.md` — policy phân loại/ưu tiên backlog
- `./fe-support-playbook.md` — playbook hỗ trợ sau release
- `./fe-meeting-agendas.md` — agenda chuẩn cho planning/checkpoint/review/retro/incidents
- `./fe-branching-strategy.md` — chiến lược branching/merge
- `./fe-backlog-triage-policy.md` — policy phân loại/ưu tiên backlog
- `./fe-support-playbook.md` — playbook hỗ trợ sau release
- `./fe-meeting-agendas.md` — agenda chuẩn cho planning/checkpoint/review/retro/incidents
- `./fe-handover-checklist.md` — checklist bàn giao dev/QA/ops
- `./fe-doc-maintenance-policy.md` — chính sách bảo trì tài liệu FE

---

## E) How to use bộ tài liệu này

1. Đọc `fe-roadmap.md` để nắm toàn cảnh.
2. Đọc `fe-delivery-process.md` để triển khai đúng quy trình.
3. Đối chiếu `fe-architecture-microservices.md` trước khi quyết định tách service.
4. Mỗi tuần dùng `fe-week-XX-plan.md` tương ứng để vận hành sprint.
5. Dùng `fe-weekly-status-report.md` và `fe-risk-register-template.md` để theo dõi.
6. Trước release, bắt buộc chạy `fe-release-checklist.md`.
7. Khi có đổi scope, dùng `fe-change-request-template.md`.
8. Khi có sự cố, thực thi `fe-incident-playbook.md`.

---

## F) Required quality gates mỗi tuần

- API contract rõ ràng trước khi code FE
- Lint + type-check + build bắt buộc pass
- Test scenario theo user flow chính
- Không để mock data đi vào production flow
- Có changelog ngắn + known issues cuối tuần

---

## G) Suggested ownership map

- **PO:** scope, priority, acceptance criteria
- **Design:** assets/spec/responsive behavior
- **FE:** integration + state + UX states
- **BE:** contract + validation + permission + performance
- **QA:** scenario/regression + release gate
- **DevOps:** CI/CD, env, secret, rollout/rollback

---

## H) Quick links (backend docs)

- `../../docs/API-CONTRACT.md`
- `../../docs/PERMISSION-MATRIX.md`
- `../../docs/STATE-MANAGEMENT.md`
- `../../docs/DB-PERFORMANCE.md`

---

## I) Versioning note

Khi thay đổi roadmap hoặc sequence tuần:
- Cập nhật `fe-roadmap.md`
- Cập nhật `fe-master-index.md`
- Ghi rõ ngày cập nhật ở đầu file
