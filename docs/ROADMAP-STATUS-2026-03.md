# ROADMAP STATUS — 2026-03-31

> **Cập nhật:** 2026-03-31
> **All 8 phases (F0–F8) + Fi + Fs + R-seed: COMPLETE**

---

## Overall Status

All phases complete. System is production-ready. Remaining work: 0 HIGH, 2 MEDIUM (JA/KO/ZH translation + I18N-RUNBOOK), 5 P2 items.

---

## Phase Completion Summary

| Phase | Name | Status | Date | Notes |
|-------|------|--------|------|-------|
| F0 | Infrastructure | ✅ COMPLETE | 2026-03-28 | Auth + API client layer, route guards |
| F1 | Public Pages | ✅ COMPLETE | 2026-03-29 | 14 public pages wired DB, 7 services |
| F2 | Booking/Orders | ✅ COMPLETE | 2026-03-29 | Wizard 8 steps, pricing config, LP discount, 5-locale |
| F3 | Team/Effects | ✅ COMPLETE | 2026-03-29 | 27 members, rank effects, EffectsTab BE CRUD |
| F4 | Academy | ✅ COMPLETE | 2026-03-29 | Video Gate, Code Exercise, Comments, Certificate |
| F5 | Customer Portal | ✅ COMPLETE | 2026-03-29 | 10 tabs all wired with graceful fallback |
| F6 | Admin 23 tabs | ✅ COMPLETE | 2026-03-30 | All 23 tabs wired to BE APIs |
| F7 | Realtime/Polish | ✅ COMPLETE | 2026-03-30 | SSE notifications, AnalyticsTab, Quests/Events seed |
| F8 | Scale Hardening | ✅ COMPLETE | 2026-03-30 | slo.ts(221L), logger.ts(265L), scaleGate.ts(552L), capacity.ts(377L), 8 Inngest jobs |
| Fi | I18n Remediation | ✅ COMPLETE | 2026-03-29 | Navbar/Footer useI18n, LocaleSwitcher cookie |
| Fs | SEO/PWA/Geo | ✅ COMPLETE | 2026-03-29 | Dynamic OG, geo tags, JSON-LD, manifest, theme_color |
| R-seed | Unified Demo Data | ✅ COMPLETE | 2026-03-30 | 28 members, LP economy, quests/events, orders, rank effects |

---

## Key Metrics

| Metric | Value |
|--------|-------|
| Total route files | 224 |
| Total Prisma models | 99 |
| i18n database columns | ~90 (across 8 models) |
| Public pages wired DB | 14 / 14 ✅ |
| Admin tabs wired | 23 / 23 ✅ |
| Scale infrastructure files | 5 (slo/logger/scaleGate/capacity/functions) |
| Inngest background jobs | 8 |
| Quality gates | ✅ lint · ✅ tsc · ✅ build |

---

## Remaining Work

### HIGH — ✅ ALL DONE

### MEDIUM (2 items)

| # | Item | Owner |
|---|------|-------|
| 1 | JA/KO/ZH professional translation (UI + CMS) | Translator |
| 2 | I18N-RUNBOOK.md finalize | FE Lead |

### P2 (5 items)

| # | Item | Owner |
|---|------|-------|
| 3 | `translations` Json field migration | BE |
| 4 | `SupportedLocale` model | BE |
| 5 | Per-locale TTFB performance audit | DevOps |
| 6 | Google Search Console verify JA/KO/ZH | SEO |
| 7 | FE bundle size optimization | FE |

---

## Risk Summary

| Risk | Impact | Status |
|------|--------|--------|
| JA/KO/ZH translation quality | MEDIUM | Active — AI draft, human review pending |
| Prisma schema changes | LOW | All migrations complete |
| SEO hreflang misconfig | LOW | Phase Fs complete |

---

## Links

| Doc | Purpose |
|-----|---------|
| `docs/FE-BE-INTEGRATION-STATUS.md` | Full FE-BE integration status |
| `docs/I18N-STATUS.md` | i18n implementation status |
| `docs/I18N-RUNBOOK.md` | i18n operations guide |
| `.claude/rules/fe-i18n-scale-plan.md` | JSON Translation migration plan (P2) |
| `.claude/rules/fe-master-index.md` | FE rules master index |
