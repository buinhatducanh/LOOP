# FE Master Index — LOOP Solutions

> **Mục đích:** 1 điểm vào duy nhất cho toàn bộ tài liệu roadmap, process, architecture, execution, governance và reporting của FE.
> **Cập nhật:** 2026-03-31 (all phases complete — line counts corrected, MembersTab translate tab confirmed ✅)

---

## A) Core FE Rules

1. `./fe-roadmap.md` ⭐
   - **FE-First Roadmap** — thiết kế từ FE mock folder, kết nối BE thật theo luồng nghiệp vụ.
   - 8 phases: F0 (Infrastructure) → F1 (Public) → F2 (Booking/Orders) → F3 (Team/Effects) → F4 (Academy) → F5 (Customer Portal) → F6 (Admin) → F7 (Realtime/Polish) → F8 (Scale Hardening)
   - Có **Phase Status Tracker** (single source of truth) để cập nhật trạng thái tuần.

2. `./fe-delivery-process.md`
   - Quy trình PO -> Design -> Dev -> QA -> Release.

3. `./fe-architecture-microservices.md`
   - Boundary kiến trúc, định hướng tách service, nguyên tắc hiệu năng.

4. `./fe-sprint-template.md`
   - Template sprint chuẩn tuần (planning/execution/QA/release).

---

## B) Phase Plans (FE-First)

> **Cách đọc:** Mỗi phase tương ứng 1 tuần làm việc. FE giữ nguyên 100% giao diện, chỉ thay mock data bằng API thật.

| Phase | Tuần | Trọng tâm | Exit Criteria |
|---|---|---|---|
| F0 | Tuần F0 | Auth + API client layer | Auth flow real JWT, `/admin` protected |
| F1 | Tuần F1 | Public pages (Landing/Services/Portfolio/Blog/Contact) | 100% public pages dùng API thật |
| F2 | Tuần F2 | Booking Wizard 8 bước + Order lifecycle | Wizard tạo order, Admin advance status |
| F3 | Tuần F3 | 27 Team Members + Rank Effects | Team + EffectsTab hoạt động từ BE |
| F4 | Tuần F4 | Academy (Enrollment → Certificate) | Student enroll → Video Gate → Certificate |
| F5 | Tuần F5 | Customer Portal + LP Economy | Dashboard 100% from BE, LP redeem hoạt động |
| F6 | Tuần F6 | Admin 23 tabs full integration | RBAC enforced, all tabs wired |
| F7 | Tuần F7 | Real-time + Quest/Events + Polish | Go-live |
| F8 | Tuần F8 | Scale Hardening (cache/async/SLO) | Ops scale gates active, SLO baseline stable |

---

## C) Legacy Weekly Plans (Context)

> Các file bên dưới giữ lại làm tài liệu tham khảo. Plan hiện tại dùng FE-First approach (Phase F0–F8).

- `./fe-week-01-plan.md` → tương đương **Phase F0 + F1**
- `./fe-week-02-plan.md` → tương đương **Phase F2**
- `./fe-week-03-plan.md` → tương đương **Phase F3 + F6**
- `./fe-week-04-plan.md` → tương đương **Phase F3 (LP/Effects)**
- `./fe-week-05-plan.md` → tương đương **Phase F4**
- `./fe-week-06-plan.md` → tương đương **Phase F7 (Realtime)**
- `./fe-week-07-plan.md` → tương đương **Phase F6**
- `./fe-week-08-plan.md` → tương đương **Phase F3 (Quests/Events)**
- `./fe-week-09-plan.md` → tương đương **Phase F6 (Analytics)**
- `./fe-week-10-plan.md` → tương đương **Phase F2 + F5 (Invoice/Tax)**
- `./fe-week-11-plan.md` → tương đương **Phase F7 (Performance)**
- `./fe-week-12-plan.md` → tương đương **Phase F7 (Regression)**
- `./fe-week-13-plan.md` → **đã hoàn thành** (i18n infrastructure + CMS tabs)
- `./fe-week-F8-plan.md` → **mới** (scale hardening operations)
- `./fe-week-F8-plan.md` → **mới** (scale hardening operations)

---

## D) i18n Expansion Plan

- `./fe-i18n-implementation-plan.md` — Phase 0-3 i18n 5 ngôn ngữ (VI/EN/JA/KO/ZH)

---

## E) Governance & Operations

- `./fe-governance-policy.md` — RACI/SLA/escalation/change control
- `./fe-incident-playbook.md` — Playbook xử lý sự cố
- `./fe-communication-plan.md` — Kế hoạch giao tiếp liên team
- `./fe-environment-matrix.md` — Ma trận môi trường dev/staging/prod
- `./fe-feature-flag-policy.md` — Policy quản trị feature flags
- `./fe-api-integration-playbook.md` — Playbook tích hợp API thật cho FE
- `./fe-code-review-checklist.md` — Checklist review code FE
- `./fe-security-review-checklist.md` — Checklist security review FE
- `./fe-dependency-policy.md` — Policy quản trị dependencies
- `./fe-testing-playbook.md` — Testing theo rủi ro
- `./fe-incident-playbook.md` — Xử lý sự cố
- `./fe-support-playbook.md` — Hỗ trợ sau release
- `./fe-handover-checklist.md` — Checklist bàn giao dev/QA/ops
- `./fe-doc-maintenance-policy.md` — Bảo trì tài liệu
- `./fe-branching-strategy.md` — Chiến lược branching
- `./fe-backlog-triage-policy.md` — Phân loại/ưu tiên backlog
- `./fe-meeting-agendas.md` — Agenda chuẩn cho các cuộc họp
- `./fe-onboarding-guide.md` — Hướng dẫn onboarding
- `./fe-adr-template.md` — Template ghi nhận ADR

---

## F) Reporting & Control Templates

- `./fe-weekly-status-report.md` — Template báo cáo tuần
- `./fe-risk-register-template.md` — Sổ đăng ký rủi ro
- `./fe-release-checklist.md` — Checklist phát hành
- `./fe-release-runbook.md` — Runbook thao tác release
- `./fe-kpi-scorecard-template.md` — KPI delivery/quality/performance
- `./fe-capacity-planning-template.md` — Hoạch định năng lực sprint
- `./fe-retrospective-template.md` — Template retrospective
- `./fe-data-contract-checklist.md` — Checklist xác minh data contract FE<->BE
- `./fe-change-request-template.md` — Mẫu Change Request
- `./fe-production-go-live-plan.md` — Kế hoạch hoàn thiện và go-live production end-to-end
- `./fe-scale-operating-runbook.md` — Runbook vận hành khi tăng tải (SLO/queue/cache/release gates)
- `./fe-phase-status-log.md` — Audit trail thay đổi trạng thái phase theo tuần
- `./fe-phase-status-log.md` — Audit trail thay đổi trạng thái phase theo tuần

---

## G) Design System & Conventions

- `FE/src/app/components/layout/ds.ts` — Design tokens (DS, GRD)
- `FE/src/app/store/authStore.ts` — Auth + Quests/Events state
- `FE/src/app/store/loopStore.ts` — Orders/Services/Portfolio/Effects state
- `FE/src/app/LOOP_OPERATIONS_DOC.tsx` — Full system operations documentation

---

## H) FE Code Conventions

- **Motion**: Longhand properties only — `backgroundColor`, `borderColor` (KHÔNG dùng `background`, `border`)
- **Colors**: Dùng `rgba()` thay vì Tailwind opacity — `rgba(59,130,246,0.15)`
- **Charts**: Pure SVG only (KHÔNG Recharts, KHÔNG D3)
- **DemoViewer.tsx**: KHÔNG CHỈNH SỬA (file đã edit thủ công)
- **TypeScript**: Strict mode, không `any`
- **CSS**: Tailwind v4 utilities, CSS variables cho design tokens

---

## I) Required Quality Gates (mỗi tuần)

- API contract chốt trước khi code
- Lint + type-check + build pass
- Test scenario theo user flow chính
- Không để mock leak vào production flow
- Scale gate cho feature P0/P1: retry + cache + async + monitoring
- Changelog ngắn + known issues cuối tuần

---

## J) Quick Commands

```bash
# Start BE (Next.js API)
cd d:/LOOP_COMPANY/LOOP && npm run dev          # port 3000

# Start FE (Vite mock)
cd d:/LOOP_COMPANY/LOOP/FE && npm run dev       # port 5173/5174

# BE type check
cd d:/LOOP_COMPANY/LOOP && npx tsc --noEmit

# FE lint
cd d:/LOOP_COMPANY/LOOP/FE && npx eslint src/

# FE type check
cd d:/LOOP_COMPANY/LOOP/FE && npx tsc --noEmit

# Phase status update (roadmap + status log)
cd d:/LOOP_COMPANY/LOOP && npm run phase:update -- --phase F2 --status in_progress --by "FE Lead" --reason "..."

# Phase status update (roadmap + status log)
cd d:/LOOP_COMPANY/LOOP && npm run phase:update -- --phase F2 --status in_progress --by "FE Lead" --reason "..."
```

---

## K) Project Context

| | BE Next.js | FE Vite Mock |
|---|---|---|
| **Path** | `d:/LOOP_COMPANY/LOOP/` | `d:/LOOP_COMPANY/LOOP/FE/` |
| **Port** | 3000 | 5173/5174 |
| **Status** | API-only, 200 routes | UI hoàn chỉnh, chưa kết nối BE |
| **Design** | Professional agency | Gaming/Cyberpunk dark theme |
| **i18n** | 5 ngôn ngữ | Hard-coded VI/EN |
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
