/**
 * Capacity Planning Tool — LOOP Solutions
 *
 * Calculate team capacity per sprint/week with:
 *   - Person-days accounting for PTO, meetings, BAU support
 *   - Risk buffer (10–20%)
 *   - Dependency tracking
 *   - Sprint output planning
 *
 * Usage:
 *   import { planSprint, calcNetCapacity } from "@/lib/capacity"
 *
 *   const plan = planSprint({
 *     members: teamMembers,
 *     startDate: "2026-03-30",
 *     endDate: "2026-04-03",
 *     commitments: sprintTasks,
 *   })
 *
 * @see {@link .claude/rules/fe-capacity-planning-template.md}
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TeamMember {
  name: string;
  role: string;
  /** Fraction of week available (0–1). E.g., 0.8 = 4 days/week after PTO/meetings */
  availability: number;
}

export interface CapacityCommitment {
  task: string;
  module: string;
  /** Estimated person-days */
  estimateDays: number;
  priority: "P0" | "P1" | "P2";
  /** Task IDs this task depends on */
  dependencies: string[];
  /** Team member assigned (or null for unassigned) */
  assignee?: string;
}

export interface SprintPlan {
  startDate: string;
  endDate: string;
  /** Total person-days raw capacity */
  totalPersonDays: number;
  /** After buffer deduction */
  netCapacity: number;
  /** Buffer applied (fraction) */
  buffer: number;
  /** Commitments breakdown by priority */
  commitments: {
    p0: number;
    p1: number;
    p2: number;
    total: number;
  };
  /** Can we fit all commitments? */
  fitsCapacity: boolean;
  /** Days of over/under allocation (negative = under capacity) */
  slack: number;
  /** Unassigned or blocked tasks */
  risks: string[];
  /** Per-member allocation summary */
  allocations: Record<string, { committed: number; available: number; utilization: number }>;
}

export interface DependencyGraph {
  tasks: string[];
  edges: [string, string][]; // [dependant, dependency]
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default buffer when nothing is specified */
const DEFAULT_BUFFER = 0.15; // 15%

/** Maximum recommended utilization before flagging risk */
const HIGH_UTILIZATION_THRESHOLD = 0.9; // 90%

// ─── Core Calculations ────────────────────────────────────────────────────────

/**
 * Calculate total person-days available for a team in a sprint.
 *
 * @param members - List of team members with availability fraction
 * @param workDays - Number of working days in the sprint window
 */
export function calcGrossCapacity(
  members: TeamMember[],
  workDays: number
): number {
  return members.reduce(
    (sum, m) => sum + workDays * m.availability,
    0
  );
}

/**
 * Calculate net capacity after applying a risk buffer.
 *
 * @param grossCapacity - Total person-days before buffer
 * @param buffer - Buffer fraction (0.1 = 10% deducted)
 */
export function calcNetCapacity(
  grossCapacity: number,
  buffer = DEFAULT_BUFFER
): number {
  return Math.round(grossCapacity * (1 - buffer));
}

/**
 * Calculate total estimated days for commitments in a sprint.
 */
export function calcCommitmentDays(
  commitments: CapacityCommitment[]
): { p0: number; p1: number; p2: number; total: number } {
  const result = { p0: 0, p1: 0, p2: 0, total: 0 };
  for (const c of commitments) {
    const key = c.priority.toLowerCase() as "p0" | "p1" | "p2";
    result[key] += c.estimateDays;
    result.total += c.estimateDays;
  }
  return result;
}

// ─── Dependency Analysis ────────────────────────────────────────────────────

/**
 * Detect circular dependencies in a task list.
 * Returns the cycle if found, null otherwise.
 */
export function detectCircularDeps(
  commitments: CapacityCommitment[]
): string[] | null {
  const taskIds = new Set(commitments.map((c) => c.task));
  const deps: Map<string, Set<string>> = new Map();

  for (const c of commitments) {
    deps.set(
      c.task,
      new Set(c.dependencies.filter((d) => taskIds.has(d)))
    );
  }

  const visited = new Set<string>();
  const path = new Set<string>();

  function dfs(task: string): boolean {
    if (path.has(task)) {
      // Found cycle
      return true;
    }
    if (visited.has(task)) return false;

    visited.add(task);
    path.add(task);

    for (const nextTask of deps.get(task) ?? []) {
      if (dfs(nextTask)) return true;
    }

    path.delete(task);
    return false;
  }

  for (const task of taskIds) {
    if (dfs(task)) {
      // Reconstruct cycle
      const cycle: string[] = [];
      for (const t of path) cycle.push(t);
      return cycle;
    }
  }

  return null;
}

/**
 * Topological sort of commitments — returns tasks in dependency order.
 * Tasks with no dependencies come first.
 */
export function sortByDependencies(
  commitments: CapacityCommitment[]
): CapacityCommitment[] {
  const taskIds = new Set(commitments.map((c) => c.task));
  const inDegree = new Map<string, number>();
  const deps = new Map<string, string[]>();

  for (const c of commitments) {
    inDegree.set(c.task, 0);
    deps.set(c.task, []);
  }

  for (const c of commitments) {
    const validDeps = c.dependencies.filter((d: string) => taskIds.has(d));
    for (const dep of validDeps) {
      deps.get(dep)?.push(c.task);
    }
    inDegree.set(c.task, (inDegree.get(c.task) ?? 0) + validDeps.length);
  }

  // Kahn's algorithm
  const queue: string[] = [];
  for (const [task, degree] of inDegree) {
    if (degree === 0) queue.push(task);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const task = queue.shift()!;
    sorted.push(task);
    for (const next of deps.get(task) ?? []) {
      const newDegree = (inDegree.get(next) ?? 1) - 1;
      inDegree.set(next, newDegree);
      if (newDegree === 0) queue.push(next);
    }
  }

  // Map back to commitments, preserving original order for same-degree tasks
  const remaining = new Map(commitments.map((c) => [c.task, c]));
  return sorted.map((t) => remaining.get(t)!).filter(Boolean);
}

// ─── Sprint Planning ────────────────────────────────────────────────────────

export interface PlanSprintOptions {
  members: TeamMember[];
  commitments: CapacityCommitment[];
  startDate: string;
  endDate: string;
  /** Buffer fraction (default 15%) */
  buffer?: number;
}

/**
 * Full sprint capacity analysis.
 *
 * Checks:
 *   - Can we fit all commitments within capacity?
 *   - Are any tasks blocked by dependencies?
 *   - Is any member overloaded?
 *   - Are there circular dependencies?
 */
export function planSprint(options: PlanSprintOptions): SprintPlan {
  const { members, commitments, startDate, endDate, buffer = DEFAULT_BUFFER } = options;

  // Working days between dates (inclusive)
  const workDays = countWorkdays(startDate, endDate);

  const gross = calcGrossCapacity(members, workDays);
  const net = calcNetCapacity(gross, buffer);
  const commitDays = calcCommitmentDays(commitments);

  const slack = net - commitDays.total;
  const fitsCapacity = slack >= 0;

  // Dependency risks
  const risks: string[] = [];

  // Circular dependency check
  const cycle = detectCircularDeps(commitments);
  if (cycle) {
    risks.push(`Circular dependency detected: ${cycle.join(" → ")}`);
  }

  // Unassigned tasks
  const unassigned = commitments.filter((c) => !c.assignee);
  if (unassigned.length > 0) {
    risks.push(`${unassigned.length} task(s) unassigned: ${unassigned.map((c) => c.task).join(", ")}`);
  }

  // High utilization per member
  const allocations: SprintPlan["allocations"] = {};

  for (const member of members) {
    const committed = commitments
      .filter((c) => c.assignee === member.name)
      .reduce((s, c) => s + c.estimateDays, 0);

    const available = workDays * member.availability;
    const utilization = available > 0 ? committed / available : 0;

    allocations[member.name] = {
      committed,
      available,
      utilization: Math.round(utilization * 100) / 100,
    };

    if (utilization > HIGH_UTILIZATION_THRESHOLD) {
      risks.push(
        `${member.name} is ${Math.round(utilization * 100)}% utilized — consider redistributing`
      );
    }
  }

  // Low capacity warning
  if (fitsCapacity && slack < net * 0.1) {
    risks.push(
      `Sprint is ${Math.round((1 - slack / net) * 100)}% full — minimal buffer remaining`
    );
  }

  return {
    startDate,
    endDate,
    totalPersonDays: gross,
    netCapacity: net,
    buffer,
    commitments: commitDays,
    fitsCapacity,
    slack,
    risks,
    allocations,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Count working days (Mon–Fri) between two dates (inclusive).
 */
export function countWorkdays(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Print a human-readable sprint summary.
 */
export function sprintSummary(plan: SprintPlan): string {
  const lines: string[] = [];

  lines.push(`📅 Sprint: ${plan.startDate} → ${plan.endDate}`);
  lines.push(
    `👥 Capacity: ${plan.totalPersonDays} person-days gross | ` +
    `${plan.netCapacity} net (−${Math.round(plan.buffer * 100)}% buffer)`
  );
  lines.push(
    `📋 Commitments: P0=${plan.commitments.p0}d ` +
    `| P1=${plan.commitments.p1}d | P2=${plan.commitments.p2}d ` +
    `| Total=${plan.commitments.total}d`
  );
  lines.push(
    `⚡ Status: ${plan.fitsCapacity ? "✅ Fits capacity" : "❌ OVER CAPACITY"} ` +
    `| Slack: ${plan.slack >= 0 ? `+${plan.slack}` : plan.slack}d`
  );

  if (plan.risks.length > 0) {
    lines.push(`\n⚠️  Risks:`);
    for (const risk of plan.risks) lines.push(`  • ${risk}`);
  }

  lines.push(`\n👤 Utilization per member:`);
  for (const [name, alloc] of Object.entries(plan.allocations)) {
    const pct = Math.round(alloc.utilization * 100);
    const bar = "█".repeat(Math.min(pct, 50)) + "░".repeat(Math.max(50 - pct, 0));
    lines.push(
      `  ${name.padEnd(16)} ${bar} ${pct}% ` +
      `(${alloc.committed}d / ${Math.round(alloc.available)}d available)`
    );
  }

  return lines.join("\n");
}
