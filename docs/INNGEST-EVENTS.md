# Inngest — Event Catalog & Background Jobs

> **Source:** `src/lib/jobs/client.ts` + `src/lib/jobs/functions.ts`
> **Handler:** `src/app/api/inngest/route.ts`
> **Updated:** 2026-03-28 | **Status:** ✅ Implemented & Consolidated

---

## Architecture

```
API Route / Event → Inngest Cloud → Worker Function → DB / Email / Cache
```

```
src/
├── lib/
│   └── jobs/                    # Sole source of truth — all jobs here
│       ├── client.ts            # Inngest singleton + event types + EVENTS map
│       └── functions.ts         # All job functions (event-driven + cron)
└── app/api/inngest/route.ts    # HTTP handler (GET/POST/PUT)
```

> ⚠️ **2026-03-28:** The `src/lib/inngest/` directory has been removed.
> All functions (website emails + PM cron jobs) are now consolidated in `src/lib/jobs/`.
> The route handler imports only from `jobs/`.

---

## Event Catalog

### Defined Events

```typescript
// src/lib/jobs/client.ts
export const EVENTS = {
  CONTACT_SUBMITTED:   "contact/submitted",
  ORDER_CREATED:       "order/created",
  ORDER_UPDATED:       "order/updated",
  USER_SIGNED_UP:      "user/signed_up",
  CACHE_INVALIDATED:   "cache/invalidated",
} as const;
```

### Event Payloads

#### `contact/submitted`
```typescript
{
  name: string;
  email: string;
  message: string;
  phone?: string;
  service?: string;
  timestamp: string;  // ISO
}
```

#### `order/created`
```typescript
{
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  totalAmount: number;
  items: string[];
  timestamp: string;  // ISO
}
```

#### `order/updated`
```typescript
{
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;  // ISO
}
```

#### `cache/invalidated`
```typescript
{
  pattern: string;
  reason: string;
  timestamp: string;  // ISO
}
```

---

## Triggering Events

### In API Routes

```typescript
import { inngest, EVENTS } from "@/lib/jobs/client";

// In a route handler after data is saved:
await inngest.send({
  name: EVENTS.CONTACT_SUBMITTED,
  data: {
    name: body.name,
    email: body.email,
    message: body.message,
    phone: body.phone,
    service: body.service,
    timestamp: new Date().toISOString(),
  },
});
```

### In API Route (Example — Contact Form)

```typescript
// src/app/api/contact/route.ts
export async function POST(req: NextRequest) {
  const result = await submitContactForm(body);
  if (!result.success) return badRequest(result.error);

  // Trigger background email jobs
  await inngest.send({
    name: EVENTS.CONTACT_SUBMITTED,
    data: { name: body.name, email: body.email, message: body.message, timestamp: new Date().toISOString() },
  });

  return ok({ id: result.data.id }, 201);
}
```

---

## Background Functions

### Implemented Functions

#### Event-Driven Jobs

| Function ID | Trigger | Description |
|------------|---------|-------------|
| `contact-confirmation-job` | `contact/submitted` | Sends confirmation email to customer + admin notification |
| `order-confirmation-job` | `order/created` | Sends order confirmation to customer |

#### Cron-Scheduled Jobs

| Function ID | Schedule | Description |
|------------|----------|-------------|
| `daily-standup-reminder` | `0 8 * * 1-5` (Mon–Fri 08:00) | Sends standup reminder to PMs without today's standup |
| `sla-violation-check` | `0 * * * *` (hourly) | Marks SLA-breached tasks + sends violation alerts |
| `sla-warning-notification` | `0 * * * *` (hourly) | Warns assignees 24h before deadline |
| `lp-monthly-report` | `0 8 1 * *` (1st of month 08:00) | Sends LP/XP monthly summary report |
| `prune-old-audit-logs` | `0 2 * * 0` (Sunday 02:00) | Deletes audit logs older than 90 days |
| `warm-cache` | `0 6,12 * * *` (06:00 + 12:00 UTC) | Pre-warms ISR cache for hot pages |

### Missing Handlers

| Event | Handler Needed |
|-------|--------------|
| `order/updated` | `order-updated-job` — notify customer on status change |
| `user/signed_up` | `welcome-email-job` — send onboarding email |
| `cache/invalidated` | No handler yet — used for documentation/future use |

---

## Cron Expression Reference

| Schedule | Cron | Description |
|----------|------|-------------|
| Every weekday 08:00 | `0 8 * * 1-5` | Daily standup reminder |
| Every hour | `0 * * * *` | SLA check + warning |
| Every Sunday 02:00 | `0 2 * * 0` | Prune old audit logs |
| Daily 06:00 + 12:00 | `0 6,12 * * *` | Cache warming |
| 1st of month 08:00 | `0 8 1 * *` | LP monthly report |

---

## Adding a New Job

### Step 1 — Event or Cron?

**Event-driven** (fires when something happens):
```typescript
// Add event type to src/lib/jobs/client.ts → EVENTS
export const EVENTS = {
  ...existing,
  TASK_COMPLETED: "task/completed",
} as const;

export interface TaskCompletedPayload {
  taskId: string;
  title: string;
  assigneeEmail: string;
  completedAt: string;
  projectOrderNumber: string;
}
```

**Cron-scheduled** (fires on a schedule):
Add directly to `functions.ts` with a cron trigger.

### Step 2 — Create the handler

```typescript
// src/lib/jobs/functions.ts
import { inngest } from "./client";
import { EVENTS } from "./client";
import type { TaskCompletedPayload } from "./client";

export const taskCompletedJob = inngest.createFunction(
  {
    id: "task-completed-notification",
    name: "Task Completed Notification",
    rateLimit: { limit: 10, period: "1m" }, // optional: rate limit
    triggers: [{ event: EVENTS.TASK_COMPLETED }],
  },
  async ({ event }) => {
    const payload = event.data as TaskCompletedPayload;
    // Send notification...
    return { notified: true, taskId: payload.taskId };
  }
);
```

### Step 3 — Register

```typescript
// src/lib/jobs/functions.ts — add to the allJobs array:
export const allJobs = [
  contactConfirmationJob,
  orderConfirmationJob,
  dailyStandupReminder,
  slaViolationCheck,
  slaWarningNotification,
  lpMonthlyReport,
  pruneOldAuditLogs,
  warmCache,
  taskCompletedJob, // ← add here
];
```

### Step 4 — Trigger

```typescript
await inngest.send({
  name: EVENTS.TASK_COMPLETED,
  data: { taskId, title, assigneeEmail, completedAt: new Date().toISOString(), projectOrderNumber },
});
```

---

## Route Handler

```typescript
// src/app/api/inngest/route.ts
export const dynamic = "force-dynamic";

import { serve } from "inngest/next";
import { inngest } from "@/lib/jobs/client";
import { allJobs } from "@/lib/jobs/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: allJobs,
});
```

All job functions are registered via the single `allJobs` array.
No need to manually merge arrays — everything is in one place.

---

## Environment Variables

```bash
INNGEST_SIGNING_KEY="sig_..."   # Keep secret — webhook verification
INNGEST_EVENT_KEY="..."         # Public — event ingestion
```

Both required. Get from [inngest.com](https://www.inngest.com) dashboard.

---

## Testing Jobs

```typescript
// src/lib/jobs/functions.test.ts
import { describe, it, expect, vi } from "vitest";
import { inngest } from "@/lib/jobs/client";

describe("contact-confirmation-job", () => {
  it("sends confirmation email", async () => {
    const mockSend = vi.fn();
    // Mock email sender
    // Invoke function handler
    // Assert email was called with correct data
  });
});
```

---

## Troubleshooting

### Jobs not firing

1. Check `INNGEST_EVENT_KEY` is set in environment
2. Check Inngest dashboard for failed runs
3. Verify function ID matches an entry in the `allJobs` array in `src/lib/jobs/functions.ts`

### Jobs timing out

Inngest gives each function 25 minutes max. For longer jobs, use `step.run()` to break into smaller steps (built into Inngest SDK automatically).

### All functions consolidated

Since 2026-03-28, all functions are in `src/lib/jobs/functions.ts` — no more splitting between `inngest/` and `jobs/`. The route handler imports only from `jobs/`.
