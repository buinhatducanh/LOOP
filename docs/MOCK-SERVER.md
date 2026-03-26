# Mock Server — Frontend Development Without Backend

> **Updated:** 2026-03-26 | **Status:** ✅ Implemented

---

## Overview

Mock routes exist at `/api/mock/*` — return realistic fake data so frontend can develop without a running backend. Activated by `NEXT_PUBLIC_MOCK_API=true`.

```
API Flow:
  NEXT_PUBLIC_MOCK_API=true  →  /api/mock/*  (fake data)
  NEXT_PUBLIC_MOCK_API=false →  /api/*        (real backend)
```

---

## Enabling Mock Mode

### Development (local)

```bash
# .env.local
NEXT_PUBLIC_MOCK_API=true
```

### Or inline when starting dev server:

```bash
NEXT_PUBLIC_MOCK_API=true npm run dev
```

### Disabling:

```bash
NEXT_PUBLIC_MOCK_API=false npm run dev
# or remove the variable entirely (defaults to false)
```

---

## Existing Mock Routes

### Public Endpoints

| Route | Handler | Data |
|-------|---------|------|
| `GET /api/mock/projects` | `src/app/api/mock/projects/route.ts` | 8 projects (sao-ke-magazine, greenlife-ecommerce, techstart-vietnam, etc.) |
| `GET /api/mock/team` | `src/app/api/mock/team/route.ts` | 10 team members (CEO → Content Writer) |
| `GET /api/mock/testimonials` | `src/app/api/mock/testimonials/route.ts` | Customer testimonials |
| `GET /api/mock/pricing/features` | `src/app/api/mock/pricing/features/route.ts` | Pricing feature comparison |
| `GET /api/mock/services` | `src/app/api/mock/services/route.ts` | Service list |
| `GET /api/mock/services/[slug]` | `src/app/api/mock/services/[slug]/route.ts` | Single service |
| `GET /api/mock/orders` | `src/app/api/mock/orders/route.ts` | Orders list |
| `GET /api/mock/dashboard` | `src/app/api/mock/dashboard/route.ts` | Dashboard stats |

### Query Parameters

All list endpoints support:

```
?page=1
?limit=10
?search=keyword    (filters by name/title)
?locale=vi        (for i18n data)
```

### Response Format

All mock routes return the standard response shape:

```json
// List
{ "data": [...], "pagination": { "page": 1, "limit": 10, "total": 8, "totalPages": 1 } }

// Error
{ "error": "Mock API not enabled" }
```

---

## Mock Guard

Every mock route uses `requireMockApi()` from `@/lib/api/mock-guard`:

```typescript
import { requireMockApi } from "@/lib/api/mock-guard";

// At the top of every mock route
export async function GET(req: NextRequest) {
  const blocked = requireMockApi();
  if (blocked) return blocked;
  // ... handler logic
}
```

If `NEXT_PUBLIC_MOCK_API` is not `true`, returns `401 Unauthorized`.

---

## Usage in Frontend

### Direct fetch (no change from real API):

```typescript
// Works identically for mock and real — just change NEXT_PUBLIC_MOCK_API
const res = await fetch("/api/projects");
const { data, pagination } = await res.json();
```

### Next.js Route Bypass (Optional)

For cleaner code, create a wrapper:

```typescript
// lib/api/client.ts
const BASE = process.env.NEXT_PUBLIC_MOCK_API === "true"
  ? "/api/mock"
  : "/api";

export async function fetchAPI(path: string, options?: RequestInit) {
  return fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
  });
}

// Usage
const res = await fetchAPI("/projects?page=1");
```

---

## Extending Mock Data

### Adding new mock routes

1. Create `src/app/api/mock/{resource}/route.ts`
2. Use `requireMockApi()` guard
3. Return standard shape: `{ data, pagination }` or `{ error }`
4. Use realistic Vietnamese data (not Lorem ipsum)

### Example — Mock FAQ endpoint

```typescript
// src/app/api/mock/faqs/route.ts
import { NextRequest } from "next/server";
import { requireMockApi } from "@/lib/api/mock-guard";
import { ok } from "@/lib/api";

const MOCK_FAQS = [
  {
    id: "1",
    question: "Thời gian thiết kế website là bao lâu?",
    answer: "Thông thường từ 7-30 ngày tùy độ phức tạp của dự án.",
    category: "Thiết kế",
  },
  // ...
];

export async function GET(req: NextRequest) {
  const blocked = requireMockApi();
  if (blocked) return blocked;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  let data = MOCK_FAQS;
  if (category) data = data.filter(f => f.category === category);

  return ok(data);
}
```

### Updating mock orders/dashboard

```typescript
// src/app/api/mock/orders/route.ts
const MOCK_ORDERS = [
  {
    id: "mock-order-1",
    orderNumber: "ORD-2026-0001",
    customerName: "Nguyễn Văn Khách",
    customerEmail: "khach@example.com",
    status: "pending",
    totalAmount: 5900000,
    createdAt: new Date().toISOString(),
  },
];
```

---

## Security Notes

- Mock routes are **dev-only** — never enabled in production
- Guard (`requireMockApi()`) returns 401 if env var is not set
- Production CI/CD never sets `NEXT_PUBLIC_MOCK_API=true`
- Mock routes should never write to the database

---

## Future: MSW (Mock Service Worker) for FE-only

For a proper MSW setup (intercepts fetch at the browser level, not server level):

```bash
npm install msw --save-dev
npx msw init public --save
```

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/projects", () => {
    return HttpResponse.json({
      data: MOCK_PROJECTS,
      pagination: { page: 1, limit: 10, total: 8, totalPages: 1 },
    });
  }),
];

// src/mocks/browser.ts
import { setupWorker } from "msw/browser";
export const worker = setupWorker(...handlers);
```

MSW is recommended once the frontend team grows and needs client-side mocking (useful for component isolation and Storybook).
