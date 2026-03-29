/**
 * SLO (Service Level Objective) type definitions.
 *
 * Shared between:
 *   - src/lib/slo.ts (BE)
 *   - FE can copy this file into FE/src/types/
 */

// ─── Core Types ───────────────────────────────────────────────────────────────

export type SLOUnit = "ms" | "%" | "count" | "min";

export type SLOSeverity = "critical" | "warning" | "info";

export interface SLOMetric {
  name: string;
  description: string;
  unit: SLOUnit;
  /** Threshold value — breach if measured value crosses this */
  threshold: number;
  /** Time window for measurement */
  window: string;
  severity: SLOSeverity;
}

export interface SLOConfig {
  version: string;
  lastUpdated: string;
  updatedBy: string;
  environment: string;
  metrics: Record<string, SLOMetric>;
}

// ─── SLO Status ─────────────────────────────────────────────────────────────

export type SLOStatus = "ok" | "warning" | "critical";

export interface SLOStatusResult {
  status: SLOStatus;
  value: number;
  threshold: number;
  /** Percentage of budget consumed (for error-budget style tracking) */
  budgetConsumed?: number;
  /** Burn rate: how fast we're consuming the error budget */
  burnRate?: number;
}

// ─── Scale Gate Types ────────────────────────────────────────────────────────

export type ScaleGateResult = {
  passed: boolean;
  warnings: ScaleGateWarning[];
  errors: ScaleGateError[];
};

export type ScaleGateWarning = {
  rule: string;
  message: string;
  /** File or endpoint where the issue was found */
  location?: string;
  /** Suggestion to fix the issue */
  suggestion: string;
};

export type ScaleGateError = {
  rule: string;
  message: string;
  location?: string;
  /** Blocking error — this gate must pass before release */
  blocking: boolean;
};

// ─── Capacity Planning ────────────────────────────────────────────────────────

export interface CapacityMember {
  name: string;
  role: string;
  availability: number; // 0–1 (fraction of week available)
}

export interface CapacityWeek {
  startDate: string;
  endDate: string;
  totalPersonDays: number;
  netCapacity: number; // after buffer
  commitments: CapacityCommitment[];
  buffer: number; // 0–1
  members: CapacityMember[];
}

export interface CapacityCommitment {
  task: string;
  module: string;
  estimateDays: number;
  priority: "P0" | "P1" | "P2";
  dependencies: string[];
}
