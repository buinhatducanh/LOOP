# FE-BE Seed Playbook — LOOP Solutions

> **Mục tiêu:** Mỗi khi BE schema thay đổi (thêm model, thêm field, sửa relation), FE mock data tương ứng phải được cập nhật TRONG CÙNG PR. Seed là nguồn dữ liệu demo mặc định khi API chưa có hoặc offline.
> **Cập nhật:** 2026-03-29

---

## 1. Tại sao cần Seed Policy

FE giữ mock data (hardcoded arrays/objects) làm fallback khi BE offline hoặc chưa implement. Khi BE schema thay đổi:

```
FE mock data ≠ BE schema  →  Broken fallback  →  Dev broken  →  Demo broken
```

**Quy tắc vàng:** Seed data và FE mock phải sync trong cùng một PR/commit với schema migration.

---

## 2. Seed Data Hierarchy

### Mức 1 — Prisma Seed (`prisma/seed.ts`)
- **Chạy:** `npx tsx prisma/seed.ts`
- **Khi nào:** Khi tạo/migrate DB mới, khi reset dev DB, khi thêm data mới vào BE schema
- **Dùng cho:** Local dev, staging, demo environments
- **Bao gồm:** Tất cả models có trong `prisma/schema.prisma`
- **Nguyên tắc:** Mỗi model mới phải có hàm seed riêng `seed<EntityName>()` trong `seed.ts`

### Mức 2 — FE Fallback (`src/app/**/*.tsx`, `src/app/store/*.ts`, `src/app/components/**/*.tsx`)
- **Dùng cho:** Runtime fallback khi BE API unavailable
- **Nguyên tắc:** Luôn fallback về data gốc khi API fail — không crash UI

### Mức 3 — Admin CMS defaults (`src/app/components/admin/*.tsx`)
- **Dùng cho:** Form defaults, empty states trong admin tabs
- **Dùng kết hợp:** BE API (ưu tiên) → local state → hardcoded defaults

---

## 3. Mỗi khi thay đổi Schema — Checklist bắt buộc

Khi tạo/modify Prisma model hoặc tạo API endpoint mới:

### Step 1: Update `prisma/seed.ts`
```
Khi thêm model mới:
  ├── Thêm hàm seed<EntityName>()
  ├── Thêm lời gọi trong main()
  └── Test: chạy seed thành công

Khi sửa model field:
  ├── Cập nhật seed<EntityName>() cho phù hợp
  └── Verify seed data mới khớp với FE types
```

### Step 2: Update FE types + mock data
```
FE mock data cần sync khi:
  ├── Model thêm field mới → thêm field vào FE type
  ├── Model đổi field name → đổi FE type field name
  ├── Model thêm relation → map vào FE nested type
  └── Model xóa field → xóa khỏi FE type + mock
```

### Step 3: Update academy.service.ts mapper
```
Khi BE response thay đổi:
  ├── Thêm/cập nhật field trong Be* type
  ├── Cập nhật map*() function để map đúng
  └── Verify FE domain type khớp UI usage
```

### Step 4: QA — Chạy seed trên local
```bash
cd d:/LOOP_COMPANY/LOOP
npx prisma migrate dev --name <meaningful_name>  # nếu có migration
npx tsx prisma/seed.ts                         # seed data mới
```

---

## 4. Current Seed Inventory

| Entity | Seed Function | FE Fallback Location | Last Updated |
|--------|-------------|---------------------|-------------|
| `Instructor` | `seedAcademy()` | AcademyPage instructors section | 2026-03-29 |
| `Course` | `seedAcademy()` | AcademyPage FALLBACK_COURSES, CourseDetailPage COURSES | 2026-03-29 |
| `Lesson` | `seedAcademy()` | CourseDetailPage curriculum (in COURSES[]) | 2026-03-29 |
| `Enrollment` | `seedAcademy()` | AcademyTab MOCK_STUDENTS | 2026-03-29 |
| `StudentProgress` | `seedAcademy()` | AcademyTab MOCK_STUDENTS progress | 2026-03-29 |
| TeamMember | `seedAllTeamMembers()` | Home.tsx memberData.ts | 2026-03-30 |
| MemberExpertise | `seedMemberExpertise()` | memberData.ts expertises[] | 2026-03-30 |
| RankEffect | `seedRankEffects()` | loopStore.ts INIT_EFFECTS | 2026-03-30 |
| MemberEffectOverride | `seedMemberOverrides()` | loopStore.ts INIT_OVERRIDES | 2026-03-30 |
| Project (Portfolio) | `seedProjects()` | loopStore.ts INIT_PORTFOLIO | 2026-03-30 |
| Order | `seedOrders()` | loopStore.ts INIT_ORDERS | 2026-03-30 |
| OrderStatusHistory | `seedOrders()` | — | 2026-03-30 |
| ProjectMember | `seedProjectMembers()` | — | 2026-03-30 |
| CustomerPoint | `seedLPEconomy()` | authStore.ts DEMO_USERS (lpBalance) | 2026-03-30 |
| LpTransaction | `seedLPEconomy()` | — | 2026-03-30 |
| User (Team) | `seedTeamUsers()` | — | 2026-03-30 |
| QuestParticipant | `seedQuestParticipants()` | — | 2026-03-30 |
| Epic | `seedPMData()` | — | 2026-03-30 |
| Backlog | `seedPMData()` | — | 2026-03-30 |
| Task | `seedPMData()` | — | 2026-03-30 |
| Quest | `seedQuests()` | authStore.ts INIT_QUESTS | 2026-03-29 |
| CompanyEvent | `seedCompanyEvents()` | authStore.ts INIT_EVENTS | 2026-03-29 |

---

## 5. Academy F4 Seed Details

### Instructors (6 records)
| Name | Specialty | Seed in |
|------|-----------|---------|
| Akira Sato | React, Next.js, TypeScript | Instructor table |
| Mei Lin | Figma, UI/UX, Design Systems | Instructor table |
| Ryo Hashimoto | Node.js, PostgreSQL, Docker | Instructor table |
| Shin Watanabe | Kubernetes, CI/CD, AWS | Instructor table |
| Yuna Park | SEO, Content Marketing | Instructor table |
| Rin Nakamura | Rust, Go, Performance | Instructor table |

### Courses (7 records — 6 published, 1 draft)
| ID | Title | Instructor | Price | LP Reward |
|----|-------|-----------|-------|---------|
| `course-react-nextjs` | React & Next.js 14 Từ Zero Đến Hero | Akira Sato | 2,000,000₫ | 200 LP |
| `course-figma-tailwind` | UI/UX Design System với Figma & Tailwind | Mei Lin | 1,500,000₫ | 150 LP |
| `course-nodejs-postgres` | Node.js API & PostgreSQL: Production-Ready | Ryo Hashimoto | 2,500,000₫ | 250 LP |
| `course-kubernetes-devops` | Kubernetes & DevOps cho Startup VN | Shin Watanabe | 3,000,000₫ | 300 LP |
| `course-seo-marketing` | SEO & Content Marketing cho SaaS B2B | Yuna Park | 1,200,000₫ | 120 LP |
| `course-rust-go` | High-Performance Rust & Go cho Backend | Rin Nakamura | 4,500,000₫ | 450 LP |
| `course-python-ml` | Python ML & AI cho Web Developer | Ryo Hashimoto | 3,500,000₫ | 350 LP (draft) |

### Lessons (seeded per course)
- Each course has 7–19 lessons
- Lessons use `orderIndex * 10` for chapter grouping (10, 20, 30...)
- First 2 lessons per course are marked `isFree = true`

### Enrollments (10 students + admin + CEO)
- 10 mock students enrolled across courses with varied progress
- admin@loop.vn enrolled in all 7 courses
- CEO (Bùi Nhật Đức Anh) enrolled in React course (100% completed)

---

## 6. Sync Rule Quick Reference

```
┌─────────────────────────────────────────────────────────────┐
│  BE thay đổi schema (model/field/relation mới)            │
└────────────────────────┬────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Tạo/modify prisma migration                            │
│  2. Cập nhật prisma/seed.ts (thêm seed<Entity>())         │
│  3. Cập nhật FE types trong api/*.service.ts               │
│  4. Cập nhật map*() function nếu BE response đổi          │
│  5. Cập nhật FE fallback/mock data nếu cần                  │
│  6. Verify seed: npx tsx prisma/seed.ts                   │
│  7. Verify build: npm run build                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Testing Seed Data

```bash
# 1. Reset + migrate + seed fresh DB
cd d:/LOOP_COMPANY/LOOP
npx prisma migrate reset --force
npx tsx prisma/seed.ts

# 2. Verify seed worked
npx prisma studio  # open DB browser, check records

# 3. Verify FE still works with new seed
cd d:/LOOP_COMPANY/LOOP/FE
npm run dev

# 4. Smoke test key endpoints
curl http://localhost:3000/api/v1/courses?lang=vi
curl http://localhost:3000/api/admin/edu/courses
```

---

## 8. Anti-patterns

### ❌ KHÔNG làm những điều này

1. **Tạo migration mà không seed** — FE fallback không có data → crash
2. **Seed hardcoded IDs rồi xóa migration history** — orphan data
3. **Update FE types mà không update seed** — type mismatch trong demo
4. **Seed tạo data không khớp FE mock** — dev confusion
5. **Seed sensitive data (passwords, tokens)** — security risk
6. **Seed quá nhiều records** — slow dev DB, CI slowdown

### ✅ NÊN làm

1. Seed đủ để UI render đẹp (3-7 records thường đủ)
2. Seed dùng `upsert` để re-run không duplicate
3. Mỗi seed entity có comment mô tả rõ
4. Seed log output rõ ràng với `✓` indicators

---

## 9. Liên kết

- `prisma/seed.ts` — Seed script chính
- `prisma/schema.prisma` — Database schema
- `FE/src/api/academy.service.ts` — Academy API types + mappers
- `FE/src/app/pages/AcademyPage.tsx` — FALLBACK_COURSES
- `FE/src/app/pages/CourseDetailPage.tsx` — COURSES mock data
- `FE/src/app/components/admin/AcademyTab.tsx` — INITIAL_COURSES, MOCK_STUDENTS
