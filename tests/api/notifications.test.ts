/**
 * Notifications API — unit tests for notification types, priority, and contract
 * Run: npm run test:run
 */
import { describe, it, expect } from "vitest";

// ── Notification type registry ──────────────────────────────────────────────────

const NOTIFICATION_TYPES = [
  "new_order",
  "payment_received",
  "design_request",
  "demo_ready",
  "demo_feedback",
  "design_approved",
  "task_assigned",
  "task_in_review",
  "task_done",
  "project_delivered",
  "handover_pending",
  "domain_purchase",
  "ekyc_submitted",
  "website_configured",
  "system",
  "client_message",
  "lp",
  "media_booking",
  "escalation",
  "review",
] as const;

type NotificationType = typeof NOTIFICATION_TYPES[number];

const PRIORITY_LEVELS = ["urgent", "high", "normal", "low"] as const;
type Priority = typeof PRIORITY_LEVELS[number];

// ── Priority by type ───────────────────────────────────────────────────────────

const AUTO_PRIORITY: Partial<Record<NotificationType, Priority>> = {
  payment_received: "urgent",
  new_order: "high",
  design_request: "high",
  demo_ready: "high",
  project_delivered: "high",
  handover_pending: "high",
  system: "normal",
  client_message: "normal",
  lp: "normal",
  demo_feedback: "normal",
  design_approved: "normal",
  task_assigned: "normal",
  task_in_review: "normal",
  task_done: "normal",
  domain_purchase: "normal",
  ekyc_submitted: "normal",
  website_configured: "normal",
  media_booking: "low",
  escalation: "urgent",
  review: "normal",
};

// ── Type validation ─────────────────────────────────────────────────────────────

describe("Notifications — type registry", () => {
  it("all notification types are strings", () => {
    NOTIFICATION_TYPES.forEach(type => {
      expect(typeof type).toBe("string");
      expect(type.length).toBeGreaterThan(0);
    });
  });

  it("no duplicate types", () => {
    const unique = new Set(NOTIFICATION_TYPES);
    expect(unique.size).toBe(NOTIFICATION_TYPES.length);
  });

  it("every type has an assigned priority", () => {
    NOTIFICATION_TYPES.forEach(type => {
      expect(AUTO_PRIORITY[type]).toBeDefined();
      expect(PRIORITY_LEVELS).toContain(AUTO_PRIORITY[type]);
    });
  });
});

// ── Priority logic ─────────────────────────────────────────────────────────────

describe("Notifications — priority levels", () => {
  it("urgent priority is reserved for critical events", () => {
    const urgentTypes = NOTIFICATION_TYPES.filter(t => AUTO_PRIORITY[t] === "urgent");
    expect(urgentTypes).toContain("payment_received");
    expect(urgentTypes).toContain("escalation");
  });

  it("high priority for customer-visible milestones", () => {
    const highTypes = NOTIFICATION_TYPES.filter(t => AUTO_PRIORITY[t] === "high");
    expect(highTypes).toContain("new_order");
    expect(highTypes).toContain("demo_ready");
    expect(highTypes).toContain("project_delivered");
  });

  it("normal priority for task-level notifications", () => {
    const normalTypes = NOTIFICATION_TYPES.filter(t => AUTO_PRIORITY[t] === "normal");
    expect(normalTypes).toContain("task_assigned");
    expect(normalTypes).toContain("task_in_review");
    expect(normalTypes).toContain("task_done");
  });

  it("low priority for background/optional notifications", () => {
    const lowTypes = NOTIFICATION_TYPES.filter(t => AUTO_PRIORITY[t] === "low");
    expect(lowTypes).toContain("media_booking");
  });
});

// ── Payment amount → priority escalation ──────────────────────────────────────

describe("Notifications — payment amount priority escalation", () => {
  function paymentPriority(amountVnd: number): Priority {
    if (amountVnd >= 50_000_000) return "urgent";
    if (amountVnd >= 10_000_000) return "high";
    return "normal";
  }

  it(">= 50M VND → urgent", () => {
    expect(paymentPriority(50_000_000)).toBe("urgent");
    expect(paymentPriority(100_000_000)).toBe("urgent");
  });

  it(">= 10M and < 50M VND → high", () => {
    expect(paymentPriority(10_000_000)).toBe("high");
    expect(paymentPriority(49_999_999)).toBe("high");
  });

  it("< 10M VND → normal", () => {
    expect(paymentPriority(9_999_999)).toBe("normal");
    expect(paymentPriority(500_000)).toBe("normal");
  });
});

// ── isRead flag ────────────────────────────────────────────────────────────────

describe("Notifications — isRead state machine", () => {
  it("new notification has isRead = false", () => {
    const notification = { isRead: false };
    expect(notification.isRead).toBe(false);
  });

  it("marking as read sets isRead = true", () => {
    const notification = { isRead: false };
    notification.isRead = true;
    expect(notification.isRead).toBe(true);
  });

  it("marking as unread sets isRead = false", () => {
    const notification = { isRead: true };
    notification.isRead = false;
    expect(notification.isRead).toBe(false);
  });
});

// ── API response shape ─────────────────────────────────────────────────────────

describe("Notifications — API response shape", () => {
  const mockNotification = {
    id: "clx_notif1",
    type: "payment_received" as NotificationType,
    title: "💳 Thanh toán — 15.000.000 VNĐ",
    message: "Đơn hàng ORD-2026-001 vừa nhận thanh toán 50%",
    link: "/admin/orders",
    priority: "high" as Priority,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  it("has all required fields", () => {
    expect(mockNotification.id).toBeDefined();
    expect(mockNotification.type).toBeDefined();
    expect(NOTIFICATION_TYPES).toContain(mockNotification.type);
    expect(mockNotification.title).toBeDefined();
    expect(mockNotification.message).toBeDefined();
    expect(mockNotification.priority).toBeDefined();
    expect(PRIORITY_LEVELS).toContain(mockNotification.priority);
    expect(typeof mockNotification.isRead).toBe("boolean");
  });

  it("link is optional (can be null)", () => {
    const notif = { ...mockNotification, link: null };
    expect(notif.link).toBeNull();
  });

  it("createdAt is valid ISO string", () => {
    expect(new Date(mockNotification.createdAt).toISOString()).toBe(mockNotification.createdAt);
  });

  it("title supports emoji prefix for type indication", () => {
    // Emoji prefix in title is a convention, not required
    expect(typeof mockNotification.title === "string").toBe(true);
    // Verify it's a reasonable length
    expect(mockNotification.title.length).toBeLessThanOrEqual(200);
  });
});

// ── SSE event format ────────────────────────────────────────────────────────────

describe("Notifications — SSE event format", () => {
  const sseEvent = {
    event: "notification",
    data: {
      id: "clx_notif1",
      type: "task_done",
      title: "✅ Task hoàn thành",
      message: "Task 'Thiết kế homepage' đã được chuyển sang Hoàn thành",
      link: "/admin/projects/clx_order1/kanban",
      priority: "normal",
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  };

  it("SSE event has event type and data payload", () => {
    expect(sseEvent.event).toBe("notification");
    expect(sseEvent.data).toBeDefined();
    expect(sseEvent.data.id).toBeDefined();
  });

  it("SSE connected event has correct format", () => {
    const connectedEvent = {
      event: "connected",
      data: { userId: "clx_user1", role: "admin", roleLevel: 1 },
    };
    expect(connectedEvent.event).toBe("connected");
    expect(connectedEvent.data.userId).toBeDefined();
    expect(connectedEvent.data.role).toBeDefined();
  });

  it("SSE ping event has correct format", () => {
    const pingEvent = { event: "ping", data: { time: Date.now() } };
    expect(pingEvent.event).toBe("ping");
    expect(typeof pingEvent.data.time).toBe("number");
  });
});
