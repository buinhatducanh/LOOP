# LOOP Demo Data Re-seed Plan — Unified & Consistent

> **Mục tiêu:** Thiết kế lại toàn bộ demo data (BE seed + FE fallback) đồng nhất, có mối liên hệ thực tế giữa các domain.
> **Base:** Audit từ `prisma/seed.ts` (BE) + `memberData.ts` + `loopStore.ts` + `authStore.ts` (FE)
> **Cập nhật:** 2026-03-30

---

## 1. Tổng quan — Audit kết quả

### 1.1 Hiện trạng BE Seed

| Domain | Trạng thái | Chi tiết |
|--------|-----------|---------|
| Academy (instructors, courses, lessons, enrollments, progress) | ✅ Full seed | ~6 instructors, 7 courses, ~65 lessons, 10+ enrollments |
| Pricing (Service, ServicePackage, Feature, FeatureGroup, InfrastructureTier, AddonService) | ✅ Full seed | Đầy đủ pricing config |
| Team (TeamMember) | ⚠️ 1/27 | Chỉ có Akira Sato, 26 thành viên còn lại từ FE fallback |
| Auth (Admin, Client) | ⚠️ Partial | Admin + 1 client |
| FigmaDemo, Quote, QuoteRequest | ✅ Partial | Đủ demo |
| Orders, LP Transactions, RankEffects, MemberEffectOverride | ❌ Empty | Không seed — gamification loop đứt |
| Quests, CompanyEvents, QuestParticipant | ❌ Empty | Chỉ có BE model, không data |
| Project, Epic, Backlog, Task | ❌ Empty | PM subsystem là ghost |
| ProjectMember, MemberExpertise | ❌ Empty | Không link member → project/skill |
| Referral, EduPayment, Attendance, Feedback | ❌ Empty | Các subsystem không có data |

**Tóm:** ~40/80 models có data. Academy + Pricing là 2 domain hoàn chỉnh.

---

### 1.2 Hiện trạng FE Fallback Data

| Data Object | File | Count | Vấn đề chính |
|------------|------|-------|--------------|
| `members` (27 members) | `memberData.ts` | 27 | 3 member trùng name với DEMO_USERS nhưng LP/level khác nhau |
| `RANKS` (7 tiers) | `memberData.ts` | 7 | ✅ OK |
| `INIT_PORTFOLIO` (6 projects) | `loopStore.ts` | 6 | ❌ Không link → BE seed |
| `INIT_SERVICES` (4 services) | `loopStore.ts` | 4 | ⚠️ Trùng với BE `Service` seed |
| `INIT_ORDERS` (5 orders) | `loopStore.ts` | 5 | ⚠️ Dates D/M/YYYY, clientId là số, không link → BE |
| `INIT_EFFECTS` (12 effects) | `loopStore.ts` | 12 | ⚠️ Không link → BE `RankEffect` (vì BE seed rỗng) |
| `INIT_OVERRIDES` (5 overrides) | `loopStore.ts` | 5 | ⚠️ Không link → BE `MemberEffectOverride` |
| `INIT_ADMIN_NOTIFS` (12 notifs) | `loopStore.ts` | 12 | ⚠️ `Date.now()` tại import time — timestamps đóng băng |
| `INIT_CLIENT_NOTIFS` (3 notifs) | `loopStore.ts` | 3 | ⚠️ Tương tự timestamp issue |
| `INIT_QUESTS` (12 quests) | `authStore.ts` | 12 | ⚠️ Không link → BE `Quest` seed (vì BE rỗng) |
| `INIT_EVENTS` (3 events) | `authStore.ts` | 3 | ⚠️ Không link → BE `CompanyEvent` |
| `DEMO_USERS` (5 users) | `authStore.ts` | 5 | 🔴 `Haru Tanaka` (manager_media) không có trong `memberData` |

---

### 1.3 6 vấn đề nghiêm trọng cần fix

| # | Vấn đề | Tác động | Ưu tiên |
|---|--------|---------|---------|
| **P1** | `Haru Tanaka` (DEMO `manager_media`) không có trong `memberData` → avatar/member profile bị trống khi login BE thật | Demo media manager bị break | 🔴 Critical |
| **P2** | LP/level giữa `DEMO_USERS` và `memberData` không đồng bộ → cùng 1 người 2 số khác nhau | LP economy không nhất quán | 🔴 Critical |
| **P3** | `Date.now()` trong `INIT_ADMIN_NOTIFS` đóng băng tại import time → "5 phút trước" luôn hiển thị sai | Notifications timestamp sai | 🟡 Medium |
| **P4** | `INIT_ORDERS` dates dùng `D/M/YYYY` trong khi BE seed dùng ISO → date sorting/calculation sai | Order timeline bị lệch | 🟡 Medium |
| **P5** | `assignedPM` / `assignedTo` là string tên, không phải user ID → rename = broken reference | PM assignment bị break | 🟡 Medium |
| **P6** | 40+ models BE không có seed → gamification + PM loop không demo được | Nhiều feature không có data để show | 🔴 Critical |

---

## 2. Thiết kế entity relationship — Unified Data Model

### 2.1 Core Entities và mối quan hệ

```
TEAM MEMBER (27 người)
  ├── User (Admin/Client) ← mỗi member có thể là admin user hoặc client user
  │     ├── role: admin | manager | staff | client
  │     ├── department: engineering | design | media | marketing | sales | finance | hr | management
  │     ├── lpBalance: số LP hiện tại (từ CustomerPoint)
  │     └── level, rank: từ RANKS config
  │
  ├── Expertise[] ← member có nhiều specialty (FE expertises seed)
  │     └── nameEn, nameVi, icon, color
  │
  ├── ProjectMember[] ← member tham gia project nào (hiện tại: rỗng)
  │     └── projectId, role: pm | designer | developer | qa | marketer
  │
  ├── LpAward[] ← nhận LP từ đâu
  │     └── source: order_complete | quest_complete | course_complete | event_bonus | manual
  │
  ├── LpTransaction[] ← lịch sử LP (award / redeem / transfer)
  │     └── type, amount, note, createdAt
  │
  ├── QuestParticipant[] ← tham gia event nào
  │     └── eventId, joinedAt
  │
  └── MemberEffectOverride[] ← effect nào được override cho member
        └── effectId, visible, selectedByMember

ORDERS (từ wizard)
  ├── customerId → Client/User (người đặt hàng)
  ├── assignedPM → TeamMember (member #1 = PM Bùi Nhật Đức Anh)
  ├── projectMembers[] → TeamMember[] (design, dev, qa assigned)
  └── OrderStatusHistory[] (6 trạng thái: pending → paid → in_progress → demo_ready → client_review → done)

LP ECONOMY
  ├── CustomerPoint ← lpBalance của mỗi User/TeamMember
  ├── LpTransaction ← lịch sử award/redeem/transfer
  ├── LpAward ← nhận LP từ hoạt động cụ thể
  ├── LpRedemption ← đổi LP lấy discount
  └── LpTransfer ← chuyển LP giữa user

QUESTS & EVENTS
  ├── Quest ← 12 quests (daily/weekly/monthly/one_time/client)
  ├── QuestParticipant ← ai tham gia event nào
  └── CompanyEvent ← 3 event

RANK EFFECTS (gamification)
  ├── RankEffect ← 12 hiệu ứng theo rank
  └── MemberEffectOverride ← override per member

ACADEMY
  ├── Instructor ← 6 instructors (tương ứng 6 member có skill teaching)
  ├── Course ← 7 courses
  ├── Enrollment ← student enrollments
  ├── StudentProgress ← video gate 35% tracking
  └── LpAward (course_complete) ← LP reward khi hoàn thành khóa
```

### 2.2 Canonical Data Source Principle

```
┌──────────────────────────────────────────────────────────────┐
│  NGUYÊN TẮC: BE seed = Nguồn sự thật (Single Source of Truth) │
└──────────────────────────────────────────────────────────────┘

1. BE seed (prisma/seed.ts) là nguồn dữ liệu chính cho tất cả entities
2. FE fallback (memberData.ts, loopStore.ts, authStore.ts) chỉ là
   RUNTIME FALLBACK khi BE API unavailable
3. FE fallback PHẢI đồng bộ với BE seed về:
   - Tên thành viên (name, slug)
   - LP balance (để authStore LP badge đúng)
   - Level/rank (để member card hiển thị đúng)
   - Project assignments (để order assignment hiển thị đúng)
4. FE fallback KHÔNG CẦN đồng bộ:
   - Chi tiết quests/events (vì BE Quest/CompanyEvent đang rỗng)
   - Chi tiết order history (vì BE Order đang rỗng)
   - Chi tiết rank effects (vì BE RankEffect đang rỗng)
5. Khi BE seed được fill đầy đủ:
   → FE fallback được deprecate dần, chỉ giữ làm hard-fail fallback
```

### 2.3 DEMO_USERS mapping — Sửa P1 + P2

```
FE authStore.ts DEMO_USERS ← MAP từ memberData.ts

| DEMO_USERS key      | memberData # | Để đâu?           | Role    | Dept         |
|---------------------|-------------|-------------------|---------|--------------|
| admin               | #7 Akira    | Management/admin  | admin   | management   | ✅ đồng bộ
| manager_media       | #14 Haru    | Media/manager     | manager | media        | ✅ SỬA: Haru vào memberData
| manager_marketing   | #4 Yuna     | Marketing/manager | manager | marketing    | ✅ đồng bộ
| staff               | #3 Ryo      | Engineering/staff | staff   | engineering  | ✅ đồng bộ
| client              | — (client)  | Customer user     | client  | —            | ✅ OK (không phải team member)

→ Mỗi DEMO_USER phải có cùng LP/level/rank với memberData tương ứng
```

---

## 3. Re-seed Plan — Chi tiết theo Phase

### Phase R1: Fix Critical Issues (P1, P2, P3) — 0.5 ngày

#### R1.1 Fix Haru Tanaka — Add to memberData.ts
```
Issue: Haru Tanaka (manager_media) trong DEMO_USERS không có trong memberData
Fix:
  1. Thêm Haru Tanaka vào memberData.ts với:
     - id: 14
     - name: "Haru Tanaka"
     - role: "Media Manager"
     - roleCode: "MKT"
     - team: "All"
     - rank: "ruby" (matching DEMO_USERS)
     - level: 72 (matching DEMO_USERS)
     - lpBalance: 45,000 (matching DEMO_USERS)
     - avatar: Unsplash URL
     - specialty: "Media Production"
     - department: "media" (FE-only field)
  2. Verify: Home.tsx merge logic → Haru hiển thị đúng rank ruby + LP 45K
```

#### R1.2 Sync LP/Level DEMO_USERS ↔ memberData
```
Issue: Akira (#7) LP=820K trong memberData nhưng LP=180K trong DEMO_USERS

Fix approach: Chọn 1 con số CHÍNH THỨC cho mỗi member

Canonical LP/Level (từ memberData — vì đây là nguồn RPG chi tiết hơn):
  - Akira (#7): level 118, LP 820,000 → CẬP NHẬT DEMO_USERS.admin
  - Haru (#14): level 72, LP 45,000 → CẬP NHẬT DEMO_USERS.manager_media
  - Yuna (#4): level 69, LP 65,000 → CẬP NHẬT DEMO_USERS.manager_marketing
  - Ryo (#3): level 28, LP 8,500 → CẬP NHẬT DEMO_USERS.staff

Note: DEMO_USERS chỉ dùng để demo login — LP sẽ được sync từ BE sau
```

#### R1.3 Fix INIT_ADMIN_NOTIFS timestamps
```
Issue: Date.now() computed at module import → timestamps đóng băng

Fix approach: Chuyển thành RELATIVE_TIME — không lưu timestamp cố định

Thay vì:
  timestamp: Date.now() - 5 * 60 * 1000  // "5 phút trước" = cố định

Dùng:
  timestamp: number  // Unix ms timestamp
  // Display: computed bằng helper function tại runtime

Tạo helper:
  function relativeTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  }

Hoặc đơn giản hơn: dùng `new Date(timestamp).toLocaleDateString('vi-VN')` cho dates cũ
```

---

### Phase R2: BE Seed — Fill LP Economy + Projects (Priority) — 1 ngày

#### R2.1 Seed LP Economy

```typescript
// prisma/seed.ts — Thêm hàm seedLPEconomy()

async function seedLPEconomy() {
  // 1. CustomerPoint — LP balance cho tất cả 27 members + demo client
  // Mỗi member có lpBalance từ memberData
  const members = await prisma.teamMember.findMany();
  for (const m of members) {
    const lpBalance = getMemberLPBalance(m.id); // từ memberData
    await prisma.customerPoint.upsert({
      where: { userId: m.id },
      create: {
        userId: m.id,
        totalLp: lpBalance + (m.lpEarned ?? 0),
        availableLp: lpBalance,
        lifetimeLp: m.lpEarned ?? lpBalance,
      },
      update: {},
    });
  }

  // 2. LpAward — LP awards cho 27 members (source: order_complete, quest_complete, course_complete)
  // Chia đều: mỗi member có 5-20 awards trong 2025-2026
  const awardSources = ['order_complete', 'quest_complete', 'course_complete', 'event_bonus', 'manual'];

  // 3. LpTransaction — lịch sử transactions đầy đủ
  // 4. LpRedemption — LP đổi discount cho orders
}
```

#### R2.2 Seed 27 Team Members đầy đủ

```typescript
// prisma/seed.ts — Thêm hàm seedAllMembers()

async function seedAllMembers() {
  // Lấy data từ memberData.ts FE (copy-paste thủ công)
  // Cần tất cả 27 members với đầy đủ fields:
  // - name, role, bio, image, expertise[]
  // - level, rank, lpBalance, lpEarned, lpSpent
  // - missions, achievements, skills, techStack
  // - department, location, languages, joinedDate
  // - social: github, linkedin, website
  // - isAvailable, isFeatured
}
```

#### R2.3 Seed Rank Effects + Member Overrides

```typescript
// prisma/seed.ts — seedRankEffects()

async function seedRankEffects() {
  // 12 effects từ INIT_EFFECTS trong loopStore.ts
  // + 5 overrides từ INIT_OVERRIDES
}
```

#### R2.4 Seed Projects + Project Members

```typescript
// prisma/seed.ts — seedProjects()

async function seedProjects() {
  // 6 projects từ INIT_PORTFOLIO
  // + ProjectMember links:
  //   VNRetail: Akira(PM), Ryo(dev), Yuna(marketing)
  //   MedApp: Haru(media), Mei(design), Shin(devops)
  //   AnalyticsPro: Ryo(lead), Akira(support)
  //   EduViet: Yuna(pm), Mei(design)
  //   StartupHub: Akira(pm), Haru(design), Yuna(marketing)
  //   FinDash: Shin(devops), Ryo(dev)
}
```

---

### Phase R3: BE Seed — Fill Orders + Quests + Events — 1 ngày

#### R3.1 Seed Orders (5 orders từ INIT_ORDERS)

```typescript
async function seedOrders() {
  // Map từ INIT_ORDERS trong loopStore.ts
  // Mỗi order:
  //   - clientId → Client/User
  //   - assignedPM → TeamMember #1 (Bùi Nhật Đức Anh)
  //   - projectMembers → TeamMember[] theo team
  //   - OrderStatusHistory: tạo history entries cho mỗi status transition
  //   - demo → FigmaDemo nếu status >= demo_ready
  //   - messages → OrderMessage entries
  //   - invoice → Payment nếu status >= paid
}
```

#### R3.2 Seed Quests + Company Events + Participants

```typescript
async function seedQuestsAndEvents() {
  // 12 quests từ INIT_QUESTS trong authStore.ts
  // 3 events từ INIT_EVENTS trong authStore.ts
  // QuestParticipant: mỗi member tham gia 2-3 events
  // QuestParticipant: mỗi member có progress trên 1-3 quests
}
```

#### R3.3 Seed Epic + Backlog + Task (Kanban)

```typescript
async function seedProjectManagement() {
  // Tạo 3 Epics
  // Tạo 10 Backlogs
  // Tạo 20 Tasks với:
  //   - assignee → TeamMember (random trong team)
  //   - epicId → Epic
  //   - status: todo | in_progress | done
  //   - priority: low | medium | high
}
```

---

### Phase R4: FE Fallback — Sync với BE Seed — 0.5 ngày

#### R4.1 Sync DEMO_USERS với memberData

```
Sau khi memberData.ts + BE seed đồng bộ:
  → DEMO_USERS chỉ cần lưu: id, name, email, avatar, role, department
  → LP/level/rank → lấy từ memberData tương ứng khi login

Implement:
  function getDemoUserWithLP(key: string): AuthUser {
    const demo = DEMO_USERS[key];
    const member = findMemberByName(demo.name); // match by name
    return {
      ...demo,
      lpBalance: member?.lpBalance ?? demo.lpBalance,
      level: member?.level ?? demo.level,
      rank: member?.rank ?? demo.rank,
    };
  }
```

#### R4.2 Fix INIT_ADMIN_NOTIFS timestamps

```
Thay Date.now() computed values → Unix timestamps cố định
Đảm bảo: timestamp values nằm trong 1 tuần gần đây (để demo realistic)
```

#### R4.3 Fix INIT_ORDERS dates

```
Thay định dạng "10/03/2026" → ISO date string
"2026-03-10T08:00:00.000Z"
Thêm computed deadlineDays: number cho display logic hiện tại
```

#### R4.4 Verify FE fallback = BE seed consistent

```
FE fallback fields cần match BE seed:
  - Member names: EXACT MATCH (vì Home.tsx dùng name-based slug matching)
  - Service IDs: EXACT MATCH (vì BookingWizard dùng service ID)
  - Effect IDs: EXACT MATCH (vì MemberCard dùng effect ID)
  - Quest IDs: EXACT MATCH (vì authStore dùng quest ID prefix)
  - Event IDs: EXACT MATCH
```

---

## 4. File-by-File Implementation Map

### 4.1 BE Seed Files

| File | Action | Phụ thuộc |
|------|--------|-----------|
| `prisma/seed.ts` | Rewrite to include all 27 members, LP economy, projects, orders, quests, effects, overrides, PM data | — |
| `prisma/schema.prisma` | Check: có đủ fields cho seed data chưa | — |

### 4.2 FE Files

| File | Action | Phụ thuộc |
|------|--------|-----------|
| `FE/src/app/components/team/memberData.ts` | Add Haru Tanaka (#14); sync LP/level 4 shared members | — |
| `FE/src/app/store/authStore.ts` | Update DEMO_USERS LP/level; add helper `getDemoUserWithLP()`; fix INIT_QUESTS/INIT_EVENTS IDs | memberData.ts |
| `FE/src/app/store/loopStore.ts` | Fix INIT_ADMIN_NOTIFS timestamps; fix INIT_ORDERS dates; verify INIT_EFFECTS/INIT_OVERRIDES IDs match | BE seed |
| `FE/src/app/Home.tsx` | Verify merge logic hoạt động với Haru Tanaka | memberData.ts |
| `FE/src/app/components/admin/EffectsTab.tsx` | Verify effect IDs match INIT_EFFECTS | loopStore.ts |
| `FE/src/api/team.service.ts` | Verify mapper đúng sau khi BE seed 27 members | BE seed |

---

## 5. Implementation Order (Critical Path)

```
Day 1 Morning — R1 (Critical fixes)
  ├── [ ] Fix R1.1: Add Haru Tanaka to memberData.ts
  ├── [ ] Fix R1.2: Sync DEMO_USERS LP/level với memberData
  └── [ ] Fix R1.3: Fix INIT_ADMIN_NOTIFS timestamps

Day 1 Afternoon — R2 (BE LP + Members)
  ├── [ ] Add seedAllMembers() — 27 members
  ├── [ ] Add seedLPEconomy() — CustomerPoint + LpTransaction + LpAward
  ├── [ ] Add seedRankEffects() — 12 effects + 5 overrides
  └── [ ] Run: npx tsx prisma/seed.ts → verify 27 members in DB

Day 2 Morning — R3 (BE Orders + Quests + PM)
  ├── [ ] Add seedProjects() — 6 projects + ProjectMembers
  ├── [ ] Add seedOrders() — 5 orders + messages + status history
  ├── [ ] Add seedQuestsAndEvents() — 12 quests + 3 events + participants
  └── [ ] Add seedProjectManagement() — Epic + Backlog + Task

Day 2 Afternoon — R4 (FE Sync)
  ├── [ ] Verify memberData.ts IDs match BE seed slugs
  ├── [ ] Update authStore DEMO_USERS sync
  ├── [ ] Fix loopStore timestamps + dates
  ├── [ ] Verify: FE build pass
  └── [ ] Smoke test: login với mỗi DEMO_USERS key

Day 3 — Verification
  ├── [ ] Full smoke: admin dashboard → members → effects → quests
  ├── [ ] Verify: member cards show correct LP/rank from BE
  ├── [ ] Verify: order assignment hiển thị PM đúng
  ├── [ ] Verify: quest progress shows participant data
  └── [ ] Update: prisma/seed.ts + docs liên quan
```

---

## 6. Data Integrity Rules

### 6.1 Invariants (không được vi phạm)

```
1. Mỗi DEMO_USERS key (admin, manager_media, manager_marketing, staff, client)
   PHẢI có entry trong memberData.ts (nếu là team member)

2. LP balance trong DEMO_USERS = LP balance trong memberData tương ứng

3. Level trong DEMO_USERS = Level trong memberData tương ứng

4. Mọi `assignedPM` trong INIT_ORDERS PHẢI match với một member.name trong memberData

5. Mọi `memberId` trong INIT_OVERRIDES PHẢI match với member.id trong memberData

6. Mọi `effectId` trong INIT_OVERRIDES PHẢI match với effect.id trong INIT_EFFECTS

7. Mọi Quest ID trong INIT_EVENTS.quests[] PHẢI match với quest.id trong INIT_QUESTS

8. Timestamps trong notifications PHẢI là Unix ms (để helper function tính relative time)

9. Dates trong INIT_ORDERS PHẢI là ISO format (YYYY-MM-DDTHH:mm:ss)
```

### 6.2 Naming conventions cho seed

```
TeamMember slug → dùng: {firstName}-{lastName}.toLowerCase().replace(/\s+/g, '-')
  Akira Sato → "akira-sato"
  Bùi Nhật Đức Anh → "bui-nhat-duc-anh"
  Haru Tanaka → "haru-tanaka"

Effect ID → dùng prefix: "fx-{rank}-{index}"
  "fx-iron-1", "fx-diamond-2"

Quest ID → giữ prefix hiện tại: "q-{frequency}-{index}"
  "q-daily-1", "q-week-1", "q-ach-1"

Event ID → giữ prefix hiện tại: "ev-{index}"
  "ev-1", "ev-2", "ev-3"

Order ID → giữ format: "ORD-{YYMM}-{index}"
  "ORD-2603-01", "ORD-2603-02"
```

---

## 7. Verification Checklist

### 7.1 After BE seed run

```bash
# 1. Verify member count
npx prisma studio  # Kiểm tra: 27 TeamMember records

# 2. Verify LP data
prisma.teamMember.findMany() → kiểm tra level, rank, slug đầy đủ

# 3. Verify LP economy
prisma.customerPoint.count() → phải = 28 (27 members + 1 client)
prisma.lpTransaction.count() → phải > 100 entries

# 4. Verify effects
prisma.rankEffect.count() → phải = 12
prisma.memberEffectOverride.count() → phải = 5

# 5. Verify orders
prisma.order.count() → phải = 5
prisma.orderStatusHistory.count() → phải > 15

# 6. Verify quests/events
prisma.quest.count() → phải = 12
prisma.companyEvent.count() → phải = 3

# 7. Verify projects
prisma.project.count() → phải = 6
prisma.projectMember.count() → phải > 6

# 8. Verify PM data
prisma.epic.count() → phải = 3
prisma.task.count() → phải > 10
```

### 7.2 After FE sync

```bash
# 1. Type check
cd d:/LOOP_COMPANY/LOOP/FE && npx tsc --noEmit

# 2. Build
npm run build

# 3. Smoke test (manual)
- Login với admin → Dashboard hiển thị Akira level 118, LP 820K
- Login với manager_media → Haru Tanaka hiển thị, rank ruby
- Login với staff → Ryo Hashimoto hiển thị
- /admin → Effects tab → 12 effects
- /admin → Quests tab → 12 quests + 3 events
- /admin → Members tab → 27 members
- /admin → Orders → 5 orders với PM assignments đúng
- /doi-ngu → 27 member cards hiển thị correct LP/rank
```

---

## 8. Rollback Plan

```
Nếu seed lỗi:
  1. npx prisma migrate reset --force
  2. npx tsx prisma/seed.ts  (chạy lại)
  3. Verify: prisma studio kiểm tra data

Nếu FE build fail sau sync:
  1. Git stash changes
  2. Build để xác nhận baseline OK
  3. Apply từng FE file change một để isolate break

Nếu BE seed + FE fallback không match (merge broken):
  → Home.tsx dùng: apiMembers.length > 0 ? apiMembers : fallbackMembers
  → Luôn fallback về FE fallback khi BE problem
  → KHÔNG crash — chỉ hiển thị fallback data
```

---

## 9. Dependencies

| Phase | Phụ thuộc |
|-------|-----------|
| R1 (FE fixes) | Không có — chạy độc lập |
| R2 (BE Members + LP) | memberData.ts (source of truth) |
| R3 (BE Orders + Quests) | R2 (vì orders link → members) |
| R4 (FE sync) | R2 + R3 (vì FE fallback phải match BE seed) |

---

## 10. Estimated Effort

| Phase | Công việc | Estimate |
|-------|----------|---------|
| R1 | FE critical fixes (P1, P2, P3) | 2-3 giờ |
| R2 | BE seed: 27 members + LP economy + effects + projects | 4-5 giờ |
| R3 | BE seed: orders + quests + events + PM data | 4-5 giờ |
| R4 | FE sync: verify + fix data consistency | 2-3 giờ |
| **Total** | | **~1.5 ngày** |

---

## 11. Files to modify

### BE (prisma/seed.ts)
```
+ seedAllMembers()     — 27 TeamMember records (sync từ memberData.ts)
+ seedLPEconomy()      — CustomerPoint + LpTransaction + LpAward
+ seedRankEffects()     — 12 RankEffect + 5 MemberEffectOverride
+ seedProjects()        — 6 Project + ProjectMember links
+ seedOrders()          — 5 Order + OrderStatusHistory + messages + demo
+ seedQuestsAndEvents() — 12 Quest + 3 CompanyEvent + QuestParticipant
+ seedProjectMgmt()     — Epic + Backlog + Task (Kanban)
```

### FE (memberData.ts)
```
+ Haru Tanaka (#14) — Media Manager, Ruby, level 72, LP 45,000
~ Akira Sato (#7) — verify level 118, LP 820,000
~ Ryo Hashimoto (#3) — verify level 28, LP 8,500
~ Yuna Park (#4) — verify level 69, LP 65,000
```

### FE (authStore.ts)
```
~ DEMO_USERS — sync LP/level với memberData tương ứng
~ INIT_QUESTS — verify IDs match BE Quest seed (khi R3 done)
~ INIT_EVENTS — verify IDs match BE CompanyEvent seed (khi R3 done)
```

### FE (loopStore.ts)
```
~ INIT_ADMIN_NOTIFS — fix Date.now() → Unix timestamps cố định
~ INIT_ORDERS — fix D/M/YYYY → ISO dates
~ INIT_EFFECTS — verify IDs consistent với BE RankEffect
~ INIT_OVERRIDES — verify memberId + effectId consistent
```

---

## 12. Post-Implementation — Cập nhật Docs

Sau khi re-seed xong, cập nhật:

- [ ] `CLAUDE.md` — Phase status: F3 Team/Effects seed complete
- [ ] `fe-be-seed-playbook.md` — Seed inventory table → updated
- [ ] `fe-roadmap.md` — Ghi nhận: BE seed now covers all demo data
- [ ] `fe-phase-status-log.md` — Log R1-R4 entries
- [ ] `docs/SEED-INVENTORY.md` — (tạo mới) — Danh sách tất cả seed entities + invariants
