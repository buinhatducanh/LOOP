# FE Phase Status Log — LOOP Solutions

> **Mục tiêu:** Lưu lịch sử thay đổi trạng thái roadmap F0–F8 theo tuần để audit minh bạch.
> **Cập nhật:** 2026-03-29

---

## 1) Cách dùng

- Mỗi lần đổi trạng thái phase trong `fe-roadmap.md`, thêm 1 dòng log vào file này.
- Không xóa lịch sử cũ.
- Mọi entry phải có owner và lý do đổi trạng thái.
- Nếu status đổi sang `blocked` bắt buộc có ETA và escalation owner.

---

## 2) Status chuẩn

Chỉ dùng 4 trạng thái:
- `pending`
- `in_progress`
- `blocked`
- `completed`

---

## 3) Log table (append-only)

| Date | Week | Phase | Old Status | New Status | Changed By | Reason | Impact | ETA Recovery | Escalation Owner | Related Docs |
|------|------|-------|------------|------------|------------|--------|--------|--------------|------------------|--------------|
| 2026-03-28 | F0 | F0 Infrastructure | pending | in_progress | FE Lead | Khởi động wiring auth + api client | low | N/A | N/A | fe-roadmap.md |
| 2026-03-29 | F0 | F0 Infrastructure | in_progress | completed | FE Lead | API client + auth service + store wired, build pass, auth guards active | low | N/A | N/A | fe-roadmap.md, fe-week-F0-plan.md |
| 2026-03-29 | F1 | F1 Public Pages | pending | in_progress | FE Lead | Bắt đầu Phase F1: ServicesPage, PortfolioPage, LandingPage testimonials đã wired. | low | N/A | N/A | fe-roadmap.md, fe-week-01-plan.md |
| 2026-03-29 | F1 | F1 Public Pages | in_progress | completed | FE Lead | Tất cả public pages đã wired: LandingPage Services + Portfolio sections, ServicesPage, PortfolioPage, BlogPage, AcademyPage, ContactPage, Home/Team. 7 service files wired to real APIs. Fallback data active khi BE offline. Lint + build pass. | low | N/A | N/A | fe-roadmap.md |
| 2026-03-29 | F2 | F2 Booking/Orders | pending | in_progress | FE Lead | F2 i18n mandate added: GET /api/pricing/config must support ?lang= (vi/en/ja/ko/zh), ORDER_STATUS_LABELS map 6x5 locale, 5-locale QA mandatory. | medium | 2026-04-04 | FE Lead | fe-roadmap.md, fe-week-02-plan.md |
| 2026-03-29 | F2 | F2 Booking/Orders | in_progress | in_progress | FE Lead | Verified: pricing/config BE✅, bookingService.getPricingConfig✅, submitQuote BE✅, transitionOrderStatus BE✅, calcLpDiscount✅, ORDER_STATUS_LABELS✅ (localeStore.ts). Fixed: BookingWizardPage useEffect locale dependency (locale→[locale]). Added legacy path redirect (routes.tsx). Home.tsx HeroSection/RankStrip props fix. Known issue: wizard header hardcoded VI labels. | low | N/A | N/A | fe-roadmap.md |
| 2026-03-29 | F2 | F2 Booking/Orders | in_progress | completed | FE Lead | F2 COMPLETE. Item #1: WIZARD_STEP_LABELS 8×5 locale added to localeStore.ts. ProgressBar updated to accept stepLabels prop driven by WIZARD_STEP_LABELS[locale]. Build✅ lint✅. Item #2: 5-locale smoke test PASSED via Playwright — VI✅ EN✅ JA✅ KO✅ ZH✅ (ProgressBar step labels render correctly per locale). F2 closed. | low | N/A | N/A | fe-roadmap.md |
| 2026-03-29 | F3 | F3 Team/Effects | pending | in_progress | FE Lead | F3 started: hybrid strategy (BE core + fallback), EffectsTab BE persistence slice delivered. | medium | N/A | FE+BE Lead | fe-roadmap.md, EffectsTab.tsx |
| 2026-03-29 | F3 | F3 Team/Effects | in_progress | completed | FE Lead | ALL SUB-MILESTONES DONE ✅ F3.1: Home.tsx+MemberDetailPage 'vi'→useLocaleStore(), API-CONTRACT typo fixed; F3.2: hybrid confirmed (BE~40%, fallback~60%), coverage documented inline; F3.3: EffectsTab BE CRUD+global-toggle+per-member override wired; F3.4: coverage audit table in fe-roadmap.md; F3.5: 5-locale smoke PASSED (10/10 routes HTTP 200). Exit criteria met. | low | N/A | N/A | fe-roadmap.md |
| 2026-03-29 | F4 | F4 Academy | in_progress | completed | FE+BE | ALL P0/P1/P2 ✅ COMPLETE. P0: courses/[id]✅ enroll✅ PaymentModal✅. P1: Video Gate 35%✅ completeLesson API✅ Code Exercise BE sandbox (Node.js vm.runInNewContext, console capture, 2s timeout)✅ Comments GET/POST✅. P2: progress✅ certificate✅ AcademyTab CRUD✅ LP reward on completion✅. Prisma models added: LessonExercise + LessonComment. Exit criteria met — student can enroll→study→Video Gate→Code Exercise→Comments→Certificate. | low | N/A | N/A | fe-roadmap.md |

## 4) Mẫu entry nhanh

```md
| YYYY-MM-DD | Week-FX | FX <phase-name> | <old> | <new> | <owner> | <reason> | <impact> | <eta> | <escalation-owner> | <related-docs> |
```

## 4.1) Prefilled template rows (F0–F8)

> Copy block này vào cuối bảng log khi bắt đầu tuần mới, rồi điền dần các phase có thay đổi.

```md
| YYYY-MM-DD | Week-F0 | F0 Infrastructure |  |  | FE Lead |  |  |  |  | fe-roadmap.md |
| YYYY-MM-DD | Week-F1 | F1 Public Pages |  |  | FE Lead |  |  |  |  | fe-roadmap.md |
| YYYY-MM-DD | Week-F2 | F2 Booking/Orders |  |  | FE+BE Lead |  |  |  |  | fe-roadmap.md |
| YYYY-MM-DD | Week-F3 | F3 Team/Effects |  |  | FE+BE Lead |  |  |  |  | fe-roadmap.md |
| YYYY-MM-DD | Week-F4 | F4 Academy |  |  | FE+BE Lead |  |  |  |  | fe-roadmap.md |
| YYYY-MM-DD | Week-F5 | F5 Customer Portal |  |  | FE+BE Lead |  |  |  |  | fe-roadmap.md |
| YYYY-MM-DD | Week-F6 | F6 Admin 23 tabs |  |  | FE+BE Lead |  |  |  |  | fe-roadmap.md |
| YYYY-MM-DD | Week-F7 | F7 Realtime/Polish |  |  | FE+BE+DevOps |  |  |  |  | fe-roadmap.md |
| YYYY-MM-DD | Week-F8 | F8 Scale Hardening |  |  | FE+BE+DevOps |  |  |  |  | fe-roadmap.md |
```

---

## 5) Rule bắt buộc khi blocked

Nếu `New Status = blocked`:
- `Reason` phải cụ thể (không ghi chung chung)
- `Impact` phải nêu rõ ảnh hưởng release/module nào
- `ETA Recovery` phải có ngày giờ dự kiến
- `Escalation Owner` bắt buộc điền
- Tạo/cập nhật risk record tương ứng trong `fe-risk-register-template.md`

---

## 6) Weekly update SOP (10 phút)

### Option A — thủ công
1. Mở `fe-roadmap.md` → cập nhật bảng Phase Status Tracker.
2. Mở file này (`fe-phase-status-log.md`) → append log entries tương ứng.
3. Nếu có phase `blocked` → cập nhật risk register + escalation owner.
4. Update `fe-weekly-status-report.md` với highlights và blockers.
5. Check consistency giữa 3 file: roadmap tracker, phase log, weekly report.

### Option B — dùng CLI (khuyến nghị)
```bash
npm run phase:update -- --phase F2 --status in_progress --by "FE Lead" --reason "Bắt đầu wiring pricing config" --impact medium --week F2
```

Nếu chuyển sang `blocked`, bắt buộc thêm:
```bash
npm run phase:update -- --phase F2 --status blocked --by "FE Lead" --reason "BE pricing API chưa sẵn sàng" --impact high --week F2 --eta 2026-04-05 --escalation "BE Lead"
```

Script sẽ tự động:
- cập nhật status trong `fe-roadmap.md`
- append log row vào `fe-phase-status-log.md`.

---

## 7) Weekly audit checklist

- [ ] Tất cả thay đổi status trong tuần đã có log entry
- [ ] Mọi blocked phase có ETA recovery
- [ ] Mọi blocked phase đã có escalation owner
- [ ] Log đã đối chiếu với `fe-weekly-status-report.md`
- [ ] Log đã đối chiếu với `fe-roadmap.md` tracker table
- [ ] Risk register đã phản ánh các phase blocked (nếu có)

---

## 8) Liên kết
- `.claude/rules/fe-roadmap.md`
- `.claude/rules/fe-master-index.md`
- `.claude/rules/fe-weekly-status-report.md`
- `.claude/rules/fe-risk-register-template.md`
