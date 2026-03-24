/**
 * Inngest Client — handles background jobs, scheduled tasks, and event-driven workflows.
 *
 * Background jobs keep your API routes fast (no blocking operations in request cycles)
 * and provide reliability (jobs survive serverless cold starts and timeouts).
 *
 * Setup:
 *   1. Create a free account at https://www.inngest.com
 *   2. Get your Inngest signing key from the dashboard
 *   3. Add to .env.local:
 *      INNGEST_EVENT_KEY=...      (public event key)
 *      INNGEST_SIGNING_KEY=...    (signing key — keep secret)
 *   4. Add the Inngest middleware to next.config.ts:
 *      import { inngest } from "next-inngest/middleware";
 *   5. Export your functions from src/lib/jobs/index.ts and include
 *      them in your Next.js route handler at src/app/api/inngest/route.ts
 *
 * Job types:
 *   - EMAIL_JOBS: Send transactional emails (contact confirmation, order updates)
 *   - NOTIFICATION_JOBS: Admin notifications (new contact, new order, low stock)
 *   - CLEANUP_JOBS: Scheduled cleanup (expire sessions, prune audit logs)
 *   - CACHE_JOBS: Scheduled cache warming (warm ISR revalidation hints)
 */

import { Inngest } from "inngest";

// Single Inngest client for the entire application.
// Uses "loop" as the app ID — all functions register here.
export const inngest = new Inngest({
  id: "loop",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// ─── Event Types ───────────────────────────────────────────────────────────────

export const EVENTS = {
  CONTACT_SUBMITTED: "contact/submitted",
  ORDER_CREATED: "order/created",
  ORDER_UPDATED: "order/updated",
  USER_SIGNED_UP: "user/signed_up",
  CACHE_INVALIDATED: "cache/invalidated",
} as const;

export type EventType = (typeof EVENTS)[keyof typeof EVENTS];

// ─── Event Payloads ───────────────────────────────────────────────────────────

export interface ContactSubmittedPayload {
  name: string;
  email: string;
  message: string;
  phone?: string;
  service?: string;
  timestamp: string;
}

export interface OrderCreatedPayload {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  totalAmount: number;
  items: string[];
  timestamp: string;
}

export interface OrderUpdatedPayload {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
}

export interface CacheInvalidatedPayload {
  pattern: string;
  reason: string;
  timestamp: string;
}
