# ROADMAP STATUS — 2026-03-27

## Phase 0 Foundation COMPLETE

13 public pages wired to DB 5-locale routing 200 route files.

## Phase 1 JA+KO PENDING

CJK fonts translation tabs.

## Phase 2 ZH+Perf PENDING

ZH lazy-load audit.

## Phase 3 Ops PENDING

Phrase monitoring.
## Phase 0 — Foundation

COMPLETE. 13 pages wired 200 routes 5 locales.

## Phase 1 — JA+KO Expansion
PENDING. CJK fonts JA KO hreflang translation.
Effort: ~5d FE + 3d translation.

## Phase 2 — ZH+Performance
PENDING. ZH lazy-load Noto Sans SC ~8MB perf audit.
Effort: ~3d FE + 2d translation.

## Phase 3 — Scale+Ops
PENDING. Phrase Lokalise analytics runbook.
Effort: ~3d.

## Technical Debt
Add lang to /api/services /api/team LOW BE TBD.
Deprecate mock APIs LOW BE TBD.
Admin CMS translate tabs MEDIUM BE+FE Phase1.
CJK fonts HIGH FE Phase1.

## Risk Summary
CJK font ~8MB ZH MEDIUM mitigated by lazy-load.
Translation quality JA/KO/ZH MEDIUM AI+human review.
Prisma migration MEDIUM Phase0 migration done.
SEO hreflang LOW pending Phase1-2 audit.

## Key Metrics
Total route files: 200.
Public pages wired: 13.
i18n models: 7.
Locale message files: 5 x 211+ keys.
Lint errors: 0. TypeScript errors: 0. Build: PASS.

## Links
ADR: docs/ADR-2026-001-i18n-strategy.md
i18n: docs/I18N-STATUS.md
FE-BE: docs/FE-BE-INTEGRATION-STATUS.md
FE Rules: .claude/rules/fe-master-index.md
