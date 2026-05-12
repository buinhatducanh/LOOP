# ESLint Warnings — Full Audit

> **Ngày**: 2026-05-12 (cập nhật: 10:35)
> **Build**: 10:20 Vercel fail → `resolver.ts` fix 10:35 ✅ push thành công
> **Mục tiêu**: Fix triệt để — 0 warnings, 0 TypeScript errors

---

## Tổng quan

Warnings không block build, nhưng **TypeScript errors thì CÓ**:
- `any` → mất type safety → runtime bug tiềm ẩn
- Unused imports/vars → code bẩn, khó maintain
- `session` unused trong API routes → có thể thiếu auth check thật sự
- **SWC (Vercel) bắt được `any` trong `.ts` files mà local TSC bỏ qua**

---

## Build Log — Vercel (08:28:24 → 08:32:10)

```
08:32:10.860 Failed to compile.
08:32:10.860 ./src/lib/landing/resolver.ts:31:43
08:32:10.860 Type error: Parameter 's' implicitly has an 'any' type.
08:32:10.860   .map((id: string) => services.find((s) => s.id === id))
08:32:11.090 Next.js build worker exited with code: 1
```

**Lỗi này đã được FIX trong session này (2026-05-12).** Xem Section 1.5.

---

## 1. TypeScript Errors — Critical (MUST FIX)

### 1.1 `src/lib/landing/resolver.ts` — ✅ FIXED 2026-05-12

```
./src/lib/landing/resolver.ts:31:43
Parameter 's' implicitly has an 'any' type.
  .map((id: string) => services.find((s) => s.id === id))
```

**Root cause**: SWC (Vercel) bắt implicit `any` trong `.find()` callbacks trên Prisma result arrays.

**Fix đã apply** (2026-05-12):
```typescript
// Line 31
.map((id: string) => services.find((s: typeof services[number]) => s.id === id))
// Line 45
.map((id: string) => projects.find((p: typeof projects[number]) => p.id === id))
// Line 59
.map((id: string) => testimonials.find((t: typeof testimonials[number]) => t.id === id))
```

### 1.2 `src/lib/auth/permissions.ts` — ✅ FIXED 2026-05-12

```
./src/lib/auth/permissions.ts:339:65
Parameter 'md' implicitly has an 'any' type.
```

**Root cause**: `teamMember?.memberDepartments` → `.some((md) => md.isDeptHead)` — `md` không có type.

**Fix đã apply** (2026-05-12):
```typescript
import type { Prisma } from "@/generated/prisma";
// Line 340
.some((md: { isDeptHead: boolean }) => md.isDeptHead)
```

### 1.3 `src/lib/auth/session.ts` — ✅ FIXED trước đó

```
./src/lib/auth/session.ts:236:23
Types of property 'lastUsedAt' are incompatible.
```

**Fix**: `sessions.map((s) => ({ ...s, isCurrent: false }))` — TypeScript tự suy ra type.

---

## 2. Explicit `any` — Files cần fix

### 2.1 `src/app/admin/quotation/page.tsx` — CRITICAL (40+ warnings)

Root cause: `config` từ API không có type → tất cả `hostingPlans`, `packages`, `seoTiers`, `domainPrices` đều là `any[]`.

**Fix approach**: Define shared type interfaces at top of file:

```typescript
type HostingPlanEntry = {
  id: string; name: string; slug?: string; months: number;
  periodVi: string; discountedPrice: number;
};
type SeoTierEntry = { level: number; name: string; basePrice: number };
type PackageEntry = { id: string; slug: string; name: string; price: number };
type DomainPriceEntry = { id: string; extension: string; registrationPrice: number };
```

Lines: 146, 149, 156 (x2), 167, 171, 173, 183, 186, 204, 207, 217, 230, 245, 260, 300, 303, 308, 348, 350, 352, 390, 462, 471, 483, 497 (x2), 498, 513, 956, 957, 961, 962, 969, 973, 977, 982, 1121, 1129, 1146

### 2.2 `src/app/admin/media/page.tsx`

| Line | Pattern | Fix |
|------|---------|-----|
| 591 | callback param `any` | specific type |
| 595 | callback param `any` | specific type |
| 688 | `catch (err: any)` | `catch (err: unknown)` |
| 716 | callback param `any` | specific type |
| 727 | callback param `any` | specific type |
| 738 | `catch (err: any)` | `catch (err: unknown)` |
| 1561 | callback param `any` | specific type |
| 1590 | `onError: (err: any)` | `onError: (err: Error)` |
| 1725 | callback param `any` | specific type |

### 2.3 `src/app/admin/orders/page.tsx`

| Line | Pattern | Fix |
|------|---------|-----|
| 254, 257 | callback param `any` | specific type |
| 494, 674, 736 | callback param `any` | specific type |
| 1255, 1268, 1285 | callback param `any` | specific type |
| 1298, 1306, 1308, 1331 (x2) | callback param `any` | specific type |

### 2.4 `src/app/api/admin/quote-requests/route.ts`

| Line | Pattern |
|------|---------|
| 56 | callback param `any` |

### 2.5 `src/app/api/admin/quotes/route.ts`

| Line | Pattern |
|------|---------|
| 115, 182-185 (x5), 188 (x2) | callback param `any` |

### 2.6 `src/app/api/admin/seo-tiers/[id]/route.ts`

| Line | Pattern |
|------|---------|
| 64 | callback param `any` |

### 2.7 `src/app/api/admin/seo-tiers/route.ts`

| Line | Pattern |
|------|---------|
| 73 | callback param `any` |

### 2.8 `src/app/api/admin/upload/route.ts`

| Line | Pattern |
|------|---------|
| 110 | `catch (uploadError: any)` → `unknown` |

### 2.9 `src/app/api/pricing/quote/route.ts`

| Line | Pattern |
|------|---------|
| 80, 88 | callback param `any` |

### 2.10 `src/app/api/pricing/packages/route.ts`

| Line | Pattern |
|------|---------|
| 14 | callback param `any` |

### 2.11 `src/components/SearchOverlay.tsx`

| Line | Pattern | Fix |
|------|---------|-----|
| 215 | `results as any` | type `SearchResults` |
| 219 | `results as any` in reduce | type `SearchResults` |
| 335, 358 | `(item: any)` in JSX | `(item: SearchResultItem)` |

### 2.12 `src/components/admin/members/BulkLPDrawer.tsx`

| Line | Pattern |
|------|---------|
| 151 | callback param `any` |

### 2.13 `src/components/admin/members/LPAwardDrawer.tsx`

| Line | Pattern |
|------|---------|
| 124 | callback param `any` |

### 2.14 `src/components/admin/members/MemberDetailDrawer.tsx`

| Line | Pattern |
|------|---------|
| 339 | callback param `any` |

### 2.15 `src/components/landing/AcademyClient.tsx`

| Line | Pattern |
|------|---------|
| 767 | callback param `any` |

### 2.16 `src/components/landing/BookingWizardClient.tsx`

| Line | Pattern |
|------|---------|
| 705, 812-814, 821 (x2), 953 (x2), 983-984, 1007-1010 | callback param `any` |

### 2.17 `src/components/landing/media/MediaQuotationClient.tsx`

| Line | Pattern |
|------|---------|
| 61 | callback param `any` |

### 2.18 `src/components/landing/media/MediaPageClient.tsx`

| Line | Pattern |
|------|---------|
| 72, 128 | callback param `any` |

### 2.19 `src/app/[locale]/about/AboutClient.tsx`

| Line | Pattern |
|------|---------|
| 257 | callback param `any` |

---

## 3. Unused Imports — Icons & Hooks

### 3.1 `src/app/[locale]/` pages

| File | Unused |
|------|--------|
| `about/AboutClient.tsx` | MapPin, Calendar, CheckCircle2, AnimatedCounter |
| `about/page.tsx` | — |
| `case-studies/page.tsx` | resolvedLocale |
| `components/SiteHeader.tsx` | useCallback, Moon |
| `dang-nhap/register-with-token/page.tsx` | Globe, setTwitter, res |
| `dich-vu/client.tsx` | ArrowUpDown, tierLabel, PackageCard, onSelect, selectedTier, handleViewComparison, colIdx |
| `error.tsx` | locale |
| `khach-hang/_components/InvoiceTab.tsx` | ExternalLink |
| `khach-hang/_components/NotificationTab.tsx` | ChevronRight, PRIORITY_COLORS |
| `khach-hang/_components/ProjectTrackerTab.tsx` | useEffect, useState, Calendar, MessageSquare, apiClient, EMPLOYMENT_TYPE_LABELS, pm, phaseId |
| `khach-hang/page.tsx` | PaymentResultBannerWrapper |
| `media/booking/page.tsx` | locale |
| `onboarding/page.tsx` | SlideGetStarted |
| `resources/ResourcesClient.tsx` | Download, GLOW, t |
| `resources/page.tsx` | DS |
| `team/[slug]/page.tsx` | (any at line 112) |
| `testimonials/TestimonialsClient.tsx` | ChevronLeft, ChevronRight, activeFilter, setActiveFilter, serviceFilters |
| `testimonials/page.tsx` | DS, GRD |

### 3.2 `src/app/admin/` pages

| File | Unused Icons/Hooks | Unused Vars |
|------|--------------------|--------------|
| `about/page.tsx` | useMutation, useAdminTranslations, Info, Eye, EyeOff | — |
| `audit_log/page.tsx` | motion, Search, AuditRow | thisWeekCount |
| `blog/page.tsx` | useEffect, useCallback, useRef, AlertTriangle, ExternalLink, MemberOption, LocaleTabs, BacklinkEditor, previewMode, setPreviewMode, LocaleFields | sectionDivider |
| `careers/page.tsx` | useEffect, Trash2, Search, Check, Clock | updateAppMut, id, status |
| `case-studies/page.tsx` | useCallback, ChevronDown, ExternalLink | — |
| `contracts/page.tsx` | FileText | refetch |
| `departments/page.tsx` | Users, ChevronDown, BarChart3, Layers, MemberAPI, fetchDivision, fetchDepartments | totalLP, m, onEditDept, handleDeleteDivision |
| `faq/page.tsx` | useMutation, useAdminTranslations | — |
| `hr/page.tsx` | AlertTriangle | fmtDate |
| `infrastructure/page.tsx` | Toggle | — |
| `invoices/page.tsx` | Eye, Search, Receipt, TrendingUp | — |
| `leaderboard_admin/page.tsx` | — | xpPct, setViewTab, commLoading, commFetching, commRefetch, commEntries |
| `layout.tsx` | dmSans, plusJakarta | — |
| `media-cleanup/page.tsx` | Filter | — |
| `media/page.tsx` | Calendar, MessageSquare, useMutation, useAdminTranslations, AlertTriangle, Trash2, Search, Check, Clock, Filter, FileText, ChevronDown, ExternalLink | e, t, toast, setToast, isFetching |
| `members/page.tsx` | useEffect, AuthUser, ImageUpload, UserMinus, Clock, AlertTriangle, CheckCircle2, DEPARTMENTS_EN, TEAMS_VI | xpPct, rCfg, rejectReason, rankCfg, roleLabel, iconBtn, inputStyle, FormField |
| `members/types.tsx` | ReactNode | — |
| `orders/page.tsx` | useCallback, DollarSign, Package | t (8x), qc, setToast, handoverSuccess |
| `pricing/acknowledgments/AcknowledgmentsTab.tsx` | useMutation, ExternalLink, Globe | qc, idx |
| `pricing/page.tsx` | Edit2, HostingTab, DomainPricesTab | — |
| `projects/[orderId]/handover/page.tsx` | motion, AnimatePresence, Trash2 | fmtVND |
| `projects/page.tsx` | TeamMemberOption | toggleSelect, bulkDelete |
| `projects_completed/page.tsx` | — | e |
| `quests_events/page.tsx` | ChevronDown, ChevronUp | fc (x2) |
| `quotation/page.tsx` | MapPin, Calendar, CheckCircle2, ArrowUpDown, ExternalLink, ChevronRight, ChevronLeft, ChevronDown, FileText, Users, BarChart3, Layers, Info, Eye, EyeOff, Search, AlertTriangle, Filter | — |
| `revenue_split/page.tsx` | — | setConfigs |
| `seo_packages/page.tsx` | Loader2, Zap, Layers | — |
| `settings/PaymentSettingsSection.tsx` | useMutation, AlertCircle | t |
| `settings/page.tsx` | PermissionsManagement | t |
| `web_packages/page.tsx` | Save, List, ChevronRight, ChevronDown, ChevronLeft | formatDate, placeholder, LOCALE_FIELDS, isMutatingPackage |
| `SessionHydrator.tsx` | syncCookieToLocalStorage, syncFromServerSession | — |

### 3.3 `src/app/api/` routes

**~80 files** có `session` destructured nhưng không dùng. Pattern chung:
```typescript
export async function GET(req: Request) {
  try {
    const session = await requireAuth(); // hoặc await getSession()
    // session không được dùng ở đâu tiếp trong function
```

**CẨN THẬN**: Check kỹ trước khi xóa — có thể là:
1. Auth đã được check ở middleware rồi → xóa OK
2. Auth check cần thiết nhưng code không dùng → CẦN GIỮ

### 3.4 `src/components/`

| File | Unused |
|------|--------|
| `NotificationPanel.tsx` | AnimatePresence, GRD |
| `SearchOverlay.tsx` | useCallback, useRouter, usePathname, currentIndex |
| `admin/AdminLoginForm.tsx` | router, showPw, setShowPw |
| `admin/AdminSidebar.tsx` | Layers, Info, Menu, fmtLP, RANK_COLORS, userName, userAvatar, userRank, userLpBalance |
| `admin/TaskKanbanBoard.tsx` | draggingId |
| `admin/blog/RichTextEditor.tsx` | X |
| `admin/members/MemberDetailDrawer.tsx` | Info |
| `admin/members/MemberFormDrawer.tsx` | lvlNum, rankCfg |
| `landing/AcademyClient.tsx` | — |
| `landing/BlogDetailClient.tsx` | ExternalLink, Video, backlinkList |
| `landing/BookingWizardClient.tsx` | useSearchParams, Code2, ExternalLink, Zap, Eye, WizardTalent, paymentError, paidAmount, requiredAmount, selectedHostingPeriod, DB_SLUG_TO_TIER, TIER_NAMES_WEB, service, pkgCards |
| `landing/CareersClient.tsx` | DollarSign, CheckCircle2, Clock, X, ExternalLink, EMPLOYMENT_TYPE_LABELS_EN, locale, t |
| `landing/CaseStudiesClient.tsx` | X |
| `landing/CaseStudiesSectionClient.tsx` | GLOW |
| `landing/CaseStudyDetailClient.tsx` | X, Play, t, tSM, slug |
| `landing/ClientLogosSection.tsx` | GRD |
| `landing/ConsultationClient.tsx` | AnimatePresence, Send, locale |
| `landing/FaqClient.tsx` | initialCategories |
| `landing/FloatingSocialButtons.tsx` | MicroAnim |
| `landing/MediaBookingFormClient.tsx` | router |
| `landing/OnboardingClient.tsx` | BarChart3, Layers |
| `landing/PartnersClient.tsx` | CheckCircle2, TechPartner |
| `landing/PricingModeToggle.tsx` | isVi |
| `landing/SEOPackageFeatureTable.tsx` | X, isIncluded |
| `landing/ServicesSectionClient.tsx` | QueryProvider |
| `landing/StartSelectionScreen.tsx` | DS, GRD |
| `landing/TeamPreviewSection.tsx` | Zap |
| `landing/TestimonialsSection.tsx` | useCallback, GRD |
| `landing/WebPackageFeatureTable.tsx` | isIncluded |
| `landing/WebPurchaseWizard.tsx` | loadHostingPlans |
| `landing/WhyUsClient.tsx` | CheckCircle2 |
| `landing/WhyUsLandingSection.tsx` | Zap |
| `landing/media/MediaPageClient.tsx` | GLOW, Film, ShowcaseTab, StoriesTab, stats |
| `landing/media/MediaQuotationClient.tsx` | usePathname, router |
| `landing/media/PackagesTab.tsx` | GRD, GLOW, categories, setActiveFilter |
| `landing/media/ShowcaseTab.tsx` | GRD, categories, setActiveFilter |

---

## 4. Unused Variables — Assigned but Never Used

### 4.1 Common patterns across files

| Pattern | Fix |
|---------|-----|
| `t` (translator) | Remove if not used |
| `locale` in API routes | Remove if not used |
| `setX` (React setters) | Remove if not connected to UI |
| `xpPct`, `rCfg`, `rejectReason` | Remove |
| `handleX` functions | Remove if not passed to onClick |
| `fmtDate`, `fmtVND`, `fmtLP` | Remove if not used |
| `isFetching`, `isMutating` from useQuery | Just don't destructure |
| `PRIORITY_COLORS`, `EMPLOYMENT_TYPE_LABELS` | Remove if not used |
| `LOCALE_FIELDS`, `TEAMS_VI`, `DEPARTMENTS_EN` | Remove if not used |

### 4.2 Unused function args — prefix with `_`

| Arg | Files |
|-----|-------|
| `i` | `AboutClient.tsx:282` |
| `id`, `status` | `careers/page.tsx:443` |
| `phaseId` | `khach-hang/_components/ProjectTrackerTab.tsx:265` |
| `setToast`, `t` | `orders/page.tsx:1140-1142` |
| `rankCfg` | `members/page.tsx:700` |
| `placeholder` | `web_packages/page.tsx:1535` |
| `userName`, `userAvatar`, `userRank`, `userLpBalance` | `admin/AdminSidebar.tsx:204` |
| `idx` | `pricing/acknowledgments/AcknowledgmentsTab.tsx:399` |
| `e` | `media/page.tsx:752`, `projects_completed/page.tsx:374` |
| `colIdx` | `dich-vu/client.tsx:1134` |

---

## 5. Priority Fix Order

| Priority | Type | Count | Effort | Risk |
|----------|------|-------|--------|------|
| **P1** | TypeScript errors (resolver.ts, permissions.ts, session.ts) | 3 | ✅ DONE | ✅ DONE |
| **P2** | `any` trong API-heavy .tsx files (quotation, media, orders) | ~60 | Medium | Low |
| **P3** | Unused `session` in API routes | ~80 | Low | **HIGH** — verify auth |
| **P4** | Unused imports (icons, hooks) | ~120 | Low | Very Low |
| **P5** | Unused vars/args | ~50 | Low | Low |
| **P6** | ESLint config update (Next.js plugin) | 1 | Low | Very Low |

---

## 6. Quick Fix Commands

```bash
# Tự động fix unused vars và imports
npm run lint -- --fix

# Verify TypeScript
npx tsc --noEmit

# Verify build
npm run build:ci
```

**CẨN THẬN với `--fix`**:
- Xóa `session` → PHẢI verify auth vẫn hoạt động
- Xóa icon imports → verify UI không dùng icon đó
- Chạy `npm run build:ci` sau mỗi batch fix
