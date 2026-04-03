# ⚠️ PROTOTYPE ONLY — NOT PRODUCTION

This is a **standalone Vite+React design reference app**.
It is **NOT connected** to the production Next.js application.

## Production Code

```
/src/   →  ✅ PRODUCTION — Next.js 15, live at loops.vn
```

## What This Folder Is

This folder (`DESIGN LOOPS/`) is a design reference/operations doc sandbox
built with Vite + React 18. It contains:

- Full gaming/cyberpunk UI theme (Tailwind v4)
- Detailed admin tab designs (MembersTab 1,300L, OrdersTab, AcademyTab...)
- 22 page components (Academy, Blog, Booking, Customer Dashboard...)
- 49 Shadcn/ui base components (byte-for-byte identical to FE/ and /src/)
- 26 admin tab components
- Hardcoded mock data (no database)
- `LOOP_OPERATIONS_DOC.tsx` — full system documentation embedded as JSX

## What This Folder Is NOT

- ❌ Not connected to the Next.js backend (`/src/`)
- ❌ Does not call real API endpoints
- ❌ Does not use the database (Neon PostgreSQL)
- ❌ Not deployed to production
- ❌ Not actively maintained

## DO NOT

- ❌ Copy/paste code from here into `/src/` (will break production)
- ❌ Import components from here into production pages
- ❌ Use as reference for production API wiring
- ❌ Deploy this folder anywhere

## If You Need to Make Changes

All production development happens in `/src/`.
For legacy mock reference, also see `/FE/`.

## Last Sync

2026-03 — F8 Phase Complete
