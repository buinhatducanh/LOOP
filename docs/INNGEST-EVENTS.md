# Inngest — Event Catalog & Background Jobs

> **Source:** `src/lib/inngest/client.ts` + `src/lib/jobs/functions.ts` + `src/lib/inngest/functions.ts`
> **Updated:** 2026-03-26 | **Status:** ✅ Implemented

---

## Architecture

```
API Route / Event → Inngest Cloud → Worker Function → DB / Email / Cache
```

```
src/
├── lib/
│   ├── jobs/               # Shared: client.ts + all functions
│   │   ├── client.ts       # Inngest singleton + event types
│   │   └── functions.ts    # PM functions (standup, SLA, LP reports)
│   └── inngest/          # Website functions (emails, cache)
│       ├── client.ts      # Re-exports from jobs/client.ts
│       └── functions.ts    # Email + cleanup jobs
└── app/api/inngest/route.ts  # HTTP handler (GET/POST)
```

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

| Function ID | Trigger | Description |
|------------|---------|-------------|
| `contact-confirmation-job` | `contact/submitted` | Sends confirmation email to customer + admin notification |
| `order-confirmation-job` | `order/created` | Sends order confirmation to customer |
| `prune-old-audit-logs` | Cron: `0 2 * * 0` (Sun 02:00) | Deletes audit logs older than 90 days |
| `warm-cache` | Cron: `0 6,12 * * *` (06:00 + 12:00 UTC) | Pre-warms ISR cache for hot pages |
| `daily-standup-reminder` | Cron: `0 8 * * 1-5` (Mon-Fri 08:00) | Sends standup reminder to PMs without today's standup |
| `sla-violation-check` | Cron: `0 * * * *` (hourly) | Marks SLA-breached tasks + sends alerts |
| `sla-warning-notification` | Cron: `0 * * * *` (hourly) | Warns assignees 24h before deadline |
| `lp-monthly-report` | Cron: `0 8 1 * *` (1st of month 08:00) | Sends LP/XP monthly summary report |

### Not Yet Implemented (Missing Handlers)

| Event | Handler Needed |
|-------|--------------|
| `order/updated` | `order-updated-job` — notify customer on status change |
| `user/signed_up` | `welcome-email-job` — send onboarding email |
| `cache/invalidated` | `cache-invalidation-job` — coordinated multi-key invalidation |

---

## Adding a New Event

### 1. Define the event type

```typescript
// src/lib/jobs/client.ts
export const EVENTS = {
  // ...existing
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

### 2. Create the handler

```typescript
// src/lib/jobs/functions.ts
import { EVENTS, type TaskCompletedPayload } from "./client";

export const taskCompletedJob = inngest.createFunction(
  {
    id: "task-completed-notification",
    name: "Task Completed Notification",
    triggers: [{ event: EVENTS.TASK_COMPLETED }],
  },
  async ({ event }) => {
    const payload = event.data as TaskCompletedPayload;
    // Send Slack/email notification
    return { notified: true, taskId: payload.taskId };
  }
);
```

### 3. Register in the route handler

```typescript
// src/app/api/inngest/route.ts
export { GET, POST, PUT } from "inngest/next";
```

The `allJobs` + `pmFunctions` arrays in `src/lib/jobs/functions.ts` and `src/lib/inngest/functions.ts` are automatically merged in the route handler. Just add to the array.

### 4. Trigger from anywhere

```typescript
await inngest.send({
  name: EVENTS.TASK_COMPLETED,
  data: { taskId, title, assigneeEmail, completedAt: new Date().toISOString(), projectOrderNumber },
});
```

---

## Scheduled Functions

### Cron Expression Reference

| Schedule | Cron | Description |
|----------|------|-------------|
| Every weekday 08:00 | `0 8 * * 1-5` | Daily standup reminder |
| Every hour | `0 * * * *` | SLA check + warning |
| Every Sunday 02:00 | `0 2 * * 0` | Prune old audit logs |
| Daily 06:00 + 12:00 | `0 6,12 * * *` | Cache warming |
| 1st of month 08:00 | `0 8 1 * *` | LP monthly report |

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
import { inngest } from "@/lib/inngest/client";

// Test by calling the handler directly
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
3. Verify function ID matches the registered array in route handler

### Jobs timing out

Inngest gives each function 25 minutes max. For longer jobs, use `step.run()` to break into smaller steps (built into Inngest SDK automatically).

### Missing function

```typescript
// In route handler, make sure all function arrays are spread:
import { allJobs } from "@/lib/jobs/functions";     // website jobs
import { pmFunctions } from "@/lib/inngest/functions"; // PM jobs
export { GET, POST, PUT } from "inngest/next";
// handler needs both arrays merged:
serve({ client: inngest, functions: [...allJobs, ...pmFunctions] });
```
