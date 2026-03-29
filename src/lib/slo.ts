/**
 * SLO (Service Level Objectives) definitions for LOOP platform.
 *
 * These thresholds define SLAs the team commits to maintaining.
 * Used by:
 *   - `src/lib/logger.ts` for structured log fields
 *   - `src/lib/scaleGate.ts` for CI/CD gate checks
 *   - `fe-scale-operating-runbook.md` for ops monitoring
 *
 * Update values here → all consumers reflect the change automatically.
 *
 * @see {@link https://github.com/loop-company/loop/blob/main/.claude/rules/fe-scale-operating-runbook.md}
 */

import type { SLOMetric, SLOConfig } from "@/types/slo";

// ─── Metric Definitions ──────────────────────────────────────────────────────

export const METRICS = {
  // ── Endpoint SLOs ──────────────────────────────────────────────────────────

  /** Public API (v1/*) p95 latency — CDN-cached path */
  PUBLIC_API_P95: {
    name: "Public API p95 Latency",
    description: "P95 latency for /api/v1/* endpoints",
    unit: "ms",
    threshold: 300,
    window: "5m",
    severity: "critical",
  },

  /** Admin CRUD endpoint p95 latency */
  ADMIN_CRUD_P95: {
    name: "Admin CRUD p95 Latency",
    description: "P95 latency for /api/admin/* CRUD endpoints",
    unit: "ms",
    threshold: 500,
    window: "5m",
    severity: "critical",
  },

  /** Overall error rate across all endpoints */
  ERROR_RATE: {
    name: "Error Rate",
    description: "Percentage of requests returning 5xx or crashing",
    unit: "%",
    threshold: 1.0,
    window: "5m",
    severity: "critical",
  },

  // ── Queue SLOs ─────────────────────────────────────────────────────────────

  /** Time for queue backlog to drain under normal load */
  QUEUE_CLEAR_TIME: {
    name: "Queue Clear Time",
    description: "Time for normal-priority queue to drain under typical load",
    unit: "min",
    threshold: 15,
    window: "rolling",
    severity: "warning",
  },

  /** Percentage of jobs that fail after all retries */
  FAILED_JOBS_RATE: {
    name: "Failed Jobs Rate",
    description: "Percentage of Inngest jobs that fail after max retries",
    unit: "%",
    threshold: 0.5,
    window: "1h",
    severity: "critical",
  },

  /** How long a retry spike lasts before draining */
  RETRY_SPIKE_DURATION: {
    name: "Retry Spike Duration",
    description: "Duration retry spike persists before returning to normal",
    unit: "min",
    threshold: 30,
    window: "rolling",
    severity: "warning",
  },

  // ── UX SLOs ────────────────────────────────────────────────────────────────

  /** End-to-end success rate for critical user journeys */
  CRITICAL_FLOW_SUCCESS: {
    name: "Critical Flow Success Rate",
    description: "Success rate for auth, order creation, and payment flows",
    unit: "%",
    threshold: 99.0,
    window: "1h",
    severity: "critical",
  },

  /** Maximum blocker bugs allowed in a release candidate */
  BLOCKER_BUGS_IN_RC: {
    name: "Blocker Bugs in Release",
    description: "Maximum acceptable blocker-severity bugs open in release candidate",
    unit: "count",
    threshold: 0,
    window: "per_release",
    severity: "critical",
  },
} satisfies Record<string, SLOMetric>;

// ─── SLO Config ──────────────────────────────────────────────────────────────

export const SLO_CONFIG: SLOConfig = {
  version: "1.0.0",
  lastUpdated: "2026-03-28",
  updatedBy: "BE Lead",
  environment: process.env.NODE_ENV ?? "development",
  metrics: METRICS,
};

// ─── Alert Thresholds (narrower than SLO — trigger before breaching SLO) ────

export const ALERT_THRESHOLDS = {
  // Alert at ~70% of SLO threshold
  PUBLIC_API_P95_MS: Math.round(METRICS.PUBLIC_API_P95.threshold * 0.7), // 210ms
  ADMIN_CRUD_P95_MS: Math.round(METRICS.ADMIN_CRUD_P95.threshold * 0.7), // 350ms
  ERROR_RATE_PCT: METRICS.ERROR_RATE.threshold * 0.5, // 0.5%
  FAILED_JOBS_RATE_PCT: METRICS.FAILED_JOBS_RATE.threshold * 0.5, // 0.25%
  CRITICAL_FLOW_SUCCESS_PCT: 99.5,
};

// ─── Per-Endpoint SLO Assignments ────────────────────────────────────────────

/** Assign SLO targets to specific endpoint groups */
export const ENDPOINT_SLO_MAP: Record<string, string[]> = {
  [METRICS.PUBLIC_API_P95.name]: [
    "/api/v1/services",
    "/api/v1/projects",
    "/api/v1/team",
    "/api/v1/blog",
    "/api/v1/testimonials",
    "/api/v1/pricing",
  ],
  [METRICS.ADMIN_CRUD_P95.name]: [
    "/api/admin/orders",
    "/api/admin/services",
    "/api/admin/projects",
    "/api/admin/team",
    "/api/admin/blog-posts",
    "/api/admin/lp",
    "/api/admin/edu/courses",
  ],
};

// ─── Severity Escalation Map ──────────────────────────────────────────────────

export const SEVERITY_ESCALATION: Record<
  string,
  { sla: string; owner: string; channel: string }
> = {
  critical: {
    sla: "respond ≤ 30min, workaround ≤ 4h",
    owner: "BE Lead + DevOps",
    channel: "#incident-room",
  },
  warning: {
    sla: "respond ≤ 2h, fix ≤ 1 business day",
    owner: "BE Lead",
    channel: "#engineering",
  },
  info: {
    sla: "respond ≤ 1 business day",
    owner: "On-call",
    channel: "#engineering",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Check if a measured value breaches its SLO threshold.
 * - For latency/error/duration metrics: breach if value > threshold
 * - For success-rate metrics (unit=% with threshold>=90): breach if value < threshold
 */
export function isBreaching(
  metricKey: keyof typeof METRICS,
  measuredValue: number
): boolean {
  const metric = METRICS[metricKey];
  if (!metric) return false;

  // Success-rate metrics: higher is better → breach if below threshold
  if (metric.unit === "%" && metric.threshold >= 90) {
    return measuredValue < metric.threshold;
  }

  // Latency/error/duration metrics: lower is better → breach if above threshold
  return measuredValue > metric.threshold;
}

/**
 * Get SLO burn rate: how fast we're consuming the error budget.
 * burnRate > 1 means we're on track to breach within the window.
 * burnRate < 1 means we're within budget.
 */
export function getBurnRate(actualValue: number, threshold: number): number {
  if (threshold === 0) return 0;
  return actualValue / threshold;
}

/**
 * Get SLO status for a metric.
 * Real values come from monitoring dashboards (Vercel Analytics, Grafana, etc.)
 */
export function getSLOStatus(): Record<
  string,
  { status: "ok" | "warning" | "critical"; value: number; threshold: number }
> {
  return {
    PUBLIC_API_P95: { status: "ok", value: 0, threshold: METRICS.PUBLIC_API_P95.threshold },
    ADMIN_CRUD_P95: { status: "ok", value: 0, threshold: METRICS.ADMIN_CRUD_P95.threshold },
    ERROR_RATE: { status: "ok", value: 0, threshold: METRICS.ERROR_RATE.threshold },
    CRITICAL_FLOW_SUCCESS: { status: "ok", value: 100, threshold: METRICS.CRITICAL_FLOW_SUCCESS.threshold },
  };
}
