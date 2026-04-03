# FE / BE Parity — Demo vs. Production

> **2026-04-04**: `FE/` và `DESIGN LOOPS/` đã được archive (commit `38fa12e`).
> Giờ chỉ còn `src/` là codebase duy nhất.

---

## Codebase duy nhất — Production

```
src/   ✅ PRODUCTION — Next.js 15 + Prisma 7 + PostgreSQL/Neon
```

**Tất cả** references đến `FE/` hoặc `DESIGN LOOPS/` trong các rules dưới đây là **lịch sử** — các folders đó không còn trong repo.

---

## Luôn dùng BE Production làm nguồn sự thật

### ✅ Khi đọc/ghi code

1. **Chỉ dùng `src/`** cho mọi development:
   - Routes và API endpoints
   - Prisma schema / data models
   - Business logic
   - i18n messages
   - Components
   - Pages

---

## Khi nào cần thống nhất (unify)

User gọi "thống nhất" / "unify" / "đồng bộ" có nghĩa:

1. **Copy UI từ FE Demo → BE Production**
   - Layout components (Navbar, Footer) đã sync trong cùng codebase → OK
   - Page components: chỉ copy nếu BE chưa có component tương ứng

2. **Wire FE Demo → BE Production**
   - Thay mock data bằng real API calls
   - Kết nối Zustand stores → Next.js data fetching
   - Update routing nếu BE dùng App Router

3. **Copy i18n string**
   - Luôn sync file `i18n/messages/*.json` (BE) với `i18n/locales/*.json` (FE)
   - Dùng BE làm chuẩn

---

## File parity checklist

Khi thống nhất một feature, kiểm tra trong `src/`:

```
src/app/[locale]/[page]/page.tsx   ← Public pages
src/app/admin/[tab]/page.tsx      ← Admin pages
src/app/api/admin/               ← Admin API
src/lib/auth/                    ← Auth, permissions
src/i18n/messages/              ← i18n JSON
src/components/                   ← Shared components
```

---

## Command để verify

```bash
# Dev
cd D:\LOOP_COMPANY\LOOP && npm run dev          # port 3000

# Typecheck
cd D:\LOOP_COMPANY\LOOP && npx tsc --noEmit
```
