/**
 * Scale Gate Checker — enforces operational standards before release.
 *
 * Purpose:
 *   - Verify that P0/P1 features meet scale-readiness requirements
 *   - Warn (not block) on non-critical gaps
 *   - Block release on critical gaps (P0 endpoints missing essential patterns)
 *
 * Usage:
 *   // In CI/CD pipeline:
 *   import { runScaleGates } from "@/lib/scaleGate"
 *   const result = runScaleGates()
 *   if (!result.passed) {
 *     console.error("Scale gates failed:", result.errors)
 *     process.exit(1)
 *   }
 *
 *   // In development (pre-commit):
 *   import { checkEndpoint } from "@/lib/scaleGate"
 *   checkEndpoint("/api/orders", { method: "POST" })
 *
 * Run modes:
 *   - CI: fail build if blocking errors found
 *   - dev: print warnings only
 *
 * @see {@link https://github.com/loop-company/loop/blob/main/.claude/rules/fe-scale-operating-runbook.md}
 */

import type {
  ScaleGateResult,
  ScaleGateWarning,
  ScaleGateError,
} from "@/types/slo";
import { METRICS } from "./slo";

// ─── Gate Rules ───────────────────────────────────────────────────────────────

type RuleId =
  | "CACHE_STRATEGY"
  | "RETRY_POLICY"
  | "ASYNC_FOR_HEAVY_OPS"
  | "IDEMPOTENCY_KEY"
  | "QUERY_OPTIMIZATION"
  | "RATE_LIMIT"
  | "OBSERVABILITY";

interface GateRule {
  id: RuleId;
  name: string;
  description: string;
  /** Blocks release if violated */
  blocking: boolean;
  /** Severity matches SLO severity */
  severity: "critical" | "warning" | "info";
  /**
   * Check function — returns null if passes, warning/error string if fails.
   * ctx provides endpoint metadata for context-aware checks.
   */
  check: (ctx: GateContext) => string | null;
}

export interface GateContext {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** P0/P1 classification */
  priority: "P0" | "P1" | "P2";
  /** Manual annotations from @scale-gate directive (future) */
  annotations?: Record<string, unknown>;
}

// ─── Gate Rules Registry ─────────────────────────────────────────────────────

const GATE_RULES: GateRule[] = [
  // ── CACHE_STRATEGY ──────────────────────────────────────────────────────
  {
    id: "CACHE_STRATEGY",
    name: "Read-heavy endpoints must have cache strategy",
    description:
      "GET endpoints returning list or aggregate data must define a cache TTL " +
      "(Cache-Control header, ISR, or Redis cacheFetch). " +
      "Exception: authenticated endpoints returning user-specific data.",
    blocking: false, // Warning only — most endpoints work without cache, just slower
    severity: "warning",
    check(ctx: GateContext) {
      // Only check GET endpoints that return list/aggregate data
      if (ctx.method !== "GET") return null;

      // Public list endpoints should have cache
      const publicListPatterns = [
        "/api/v1/services",
        "/api/v1/projects",
        "/api/v1/team",
        "/api/v1/blog",
        "/api/v1/testimonials",
        "/api/v1/pricing",
      ];

      const isPublicList = publicListPatterns.some((p) =>
        ctx.endpoint.startsWith(p)
      );

      if (isPublicList) {
        return (
          `GET ${ctx.endpoint} is a public list endpoint without documented cache strategy. ` +
          `Expected: Cache-Control: public, max-age=60, stale-while-revalidate=120 ` +
          `or Redis cacheFetch() with TTL ≤ 60s. ` +
          `See: src/lib/redis.ts → cacheFetch() helper.`
        );
      }

      // Authenticated detail endpoints — cache ok but should be noted
      if (ctx.endpoint.match(/\/api\/admin\//) && ctx.priority === "P0") {
        return (
          `GET ${ctx.endpoint} is P0 admin endpoint. ` +
          `Consider cacheFetch() with short TTL (30–60s) or revalidate on mutation. ` +
          `See: src/lib/redis.ts → cacheFetch().`
        );
      }

      return null;
    },
  },

  // ── RETRY_POLICY ──────────────────────────────────────────────────────────
  {
    id: "RETRY_POLICY",
    name: "Mutations must document retry behavior",
    description:
      "POST/PUT/PATCH/DELETE endpoints with side effects must either implement " +
      "retry handling (idempotency key) or clearly document retry behavior.",
    blocking: false,
    severity: "warning",
    check(ctx: GateContext) {
      const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];
      if (!mutatingMethods.includes(ctx.method)) return null;

      // Critical mutations should have idempotency documented
      const criticalPatterns = [
        "/api/orders",
        "/api/admin/orders",
        "/api/academy/enroll",
        "/api/lp",
        "/api/payment",
      ];

      const isCritical =
        ctx.priority === "P0" &&
        criticalPatterns.some((p) => ctx.endpoint.includes(p));

      if (isCritical) {
        return (
          `Mutation ${ctx.method} ${ctx.endpoint} is P0/critical but no idempotency key documented. ` +
          `Expected: Idempotency-Key header + server-side deduplication. ` +
          `See: FE/src/api/client.ts → retry + idempotency implementation.`
        );
      }

      return null;
    },
  },

  // ── ASYNC_FOR_HEAVY_OPS ──────────────────────────────────────────────────
  {
    id: "ASYNC_FOR_HEAVY_OPS",
    name: "Heavy operations must run asynchronously",
    description:
      "Operations expected to take >1s must not block the request path. " +
      "They must be dispatched to Inngest (src/lib/jobs/) for async processing.",
    blocking: true, // Blocks release — sync heavy ops kill latency
    severity: "critical",
    check(ctx: GateContext) {
      const heavyPatterns = [
        "/api/admin/reports",
        "/api/admin/analytics",
        "/api/admin/export",
        "/api/email/bulk",
        "/api/notification/fanout",
        "/api/cache/warm",
        "/api/sync/",
      ];

      const isHeavy = heavyPatterns.some((p) =>
        ctx.endpoint.includes(p)
      );

      if (isHeavy && ctx.priority === "P0") {
        // Check if it dispatches to Inngest (heuristic: handler imports from @/lib/jobs)
        // This is a static check — in CI this would use AST analysis
        return (
          `Heavy operation ${ctx.method} ${ctx.endpoint} detected. ` +
          `This must run via Inngest (src/lib/jobs/) to avoid blocking request path. ` +
          `Dispatch event → src/lib/jobs/client.ts → handle async.`
        );
      }

      return null;
    },
  },

  // ── IDEMPOTENCY_KEY ──────────────────────────────────────────────────────
  {
    id: "IDEMPOTENCY_KEY",
    name: "Critical mutations must support idempotency keys",
    description:
      "Order creation, LP award/redeem, and enrollment mutations must support " +
      "Idempotency-Key header to prevent duplicate operations on retry.",
    blocking: true, // Blocks release — duplicates cause real data issues
    severity: "critical",
    check(ctx: GateContext) {
      const idempotentCriticalPatterns = [
        "/api/orders",
        "/api/admin/orders",
        "/api/academy/enroll",
        "/api/lp/redeem",
        "/api/lp/award",
      ];

      const needsIdempotency = idempotentCriticalPatterns.some((p) =>
        ctx.endpoint.includes(p)
      );

      if (
        ctx.method === "POST" &&
        needsIdempotency &&
        (ctx.priority === "P0" || ctx.priority === "P1")
      ) {
        return (
          `POST ${ctx.endpoint} is a critical mutation that requires idempotency. ` +
          `FE client.ts sends Idempotency-Key header — BE must deduplicate on this key. ` +
          `Expected: Check Idempotency-Key in DB before creating resource. ` +
          `See: src/lib/scaleGate.ts → IDEMPOTENCY_KEY rule.`
        );
      }

      return null;
    },
  },

  // ── QUERY_OPTIMIZATION ───────────────────────────────────────────────────
  {
    id: "QUERY_OPTIMIZATION",
    name: "List endpoints must paginate",
    description:
      "GET endpoints returning lists must accept page/limit query params " +
      "and return { data: T[], pagination: Pagination }. " +
      "No endpoint should return unbounded lists.",
    blocking: true, // Unbounded lists cause memory/performance issues
    severity: "critical",
    check(ctx: GateContext) {
      if (ctx.method !== "GET") return null;

      // List endpoints (not detail)
      const isListPattern =
        ctx.endpoint.match(/\/api\/.+\?/) ||
        (ctx.endpoint.match(/\/api\/v1\//) && !ctx.endpoint.match(/\/[a-z0-9]+$/i));

      if (isListPattern && !ctx.endpoint.includes("page=")) {
        return (
          `GET ${ctx.endpoint} appears to be a list endpoint without pagination. ` +
          `Expected: ?page=1&limit=20, return { data, pagination }. ` +
          `See: src/lib/api/response.ts → list() helper.`
        );
      }

      return null;
    },
  },

  // ── RATE_LIMIT ──────────────────────────────────────────────────────────
  {
    id: "RATE_LIMIT",
    name: "Public endpoints must have rate limiting",
    description:
      "All public-facing API endpoints (no auth required) must be protected " +
      "by rate limiting (src/lib/rate-limit.ts).",
    blocking: false,
    severity: "warning",
    check(ctx: GateContext) {
      // Only check public routes (no /admin/)
      if (ctx.endpoint.includes("/admin/")) return null;

      const isPublicMutation =
        ctx.method !== "GET" &&
        !ctx.endpoint.includes("/admin/");

      if (isPublicMutation && ctx.priority === "P0") {
        return (
          `Public mutation ${ctx.method} ${ctx.endpoint} should have rate limiting. ` +
          `Use: src/lib/redis.ts → publicApiRateLimit / contactRateLimit / searchRateLimit.`
        );
      }

      return null;
    },
  },

  // ── OBSERVABILITY ────────────────────────────────────────────────────────
  {
    id: "OBSERVABILITY",
    name: "P0 endpoints must have structured logging",
    description:
      "P0 endpoints must use the structured logger (src/lib/logger.ts) " +
      "for key operations to enable SLO tracking and incident response.",
    blocking: false,
    severity: "info",
    check(ctx: GateContext) {
      if (ctx.priority !== "P0") return null;

      return (
        `P0 endpoint ${ctx.method} ${ctx.endpoint} — verify structured logging is used. ` +
        `Use: import { logger } from "@/lib/logger" → logger.withSLO() for SLO-aware logs.`
      );
    },
  },
];

// ─── Gate Runner ─────────────────────────────────────────────────────────────

export interface RunGatesOptions {
  /**
   * Run mode:
   *   - "ci": exit with error code if blocking errors found
   *   - "dev": print all findings, never exit with error
   *   - "report": return structured result without side effects
   */
  mode?: "ci" | "dev" | "report";
  /**
   * Only run specific rule IDs (for targeted checks).
   * If omitted, all rules run.
   */
  rules?: RuleId[];
  /**
   * Context overrides — useful when running in CI vs local.
   */
  context?: Partial<GateContext>;
}

const DEFAULT_OPTIONS: Required<RunGatesOptions> = {
  mode: "dev",
  rules: [],
  context: {},
};

/**
 * Run all scale gates and return a structured result.
 */
export function runScaleGates(
  endpoints: GateContext[],
  options: RunGatesOptions = {}
): ScaleGateResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const warnings: ScaleGateWarning[] = [];
  const errors: ScaleGateError[] = [];

  const rules =
    opts.rules.length > 0
      ? GATE_RULES.filter((r) => opts.rules!.includes(r.id))
      : GATE_RULES;

  for (const endpoint of endpoints) {
    const ctx = { ...opts.context, ...endpoint };

    for (const rule of rules) {
      // Skip blocking rules for P2 endpoints
      if (rule.blocking && ctx.priority === "P2") continue;

      const result = rule.check(ctx);
      if (!result) continue;

      const finding = {
        rule: rule.id,
        message: result,
        location: `${ctx.method} ${ctx.endpoint}`,
        suggestion: rule.description,
      };

      if (rule.blocking) {
        errors.push({ ...finding, blocking: true });
      } else {
        warnings.push(finding);
      }
    }
  }

  const hasBlockingErrors = errors.length > 0;

  return {
    passed: opts.mode === "ci" ? !hasBlockingErrors : true,
    warnings,
    errors,
  };
}

/**
 * Check a single endpoint against all applicable rules.
 * Convenience wrapper for pre-commit hooks or individual file checks.
 */
export function checkEndpoint(
  endpoint: string,
  overrides: Partial<GateContext>
): ScaleGateResult {
  return runScaleGates([{ endpoint, method: "GET", priority: "P1", ...overrides }], {
    mode: "report",
  });
}

/**
 * Print gate results to console.
 * Returns exit code (0 = pass, 1 = fail).
 */
export function printGates(result: ScaleGateResult): number {
  if (result.passed && result.warnings.length === 0) {
    console.log("✅ Scale gates passed — no issues found.");
    return 0;
  }

  if (result.warnings.length > 0) {
    console.warn(`\n⚠️  ${result.warnings.length} warning(s):`);
    for (const w of result.warnings) {
      console.warn(`  [${w.rule}] ${w.location}`);
      console.warn(`         ${w.message}\n`);
    }
  }

  if (result.errors.length > 0) {
    console.error(`\n🚨 ${result.errors.length} blocking error(s) — release blocked:`);
    for (const e of result.errors) {
      console.error(`  [${e.rule}] ${e.location}`);
      console.error(`         ${e.message}\n`);
    }
    return 1;
  }

  if (result.warnings.length > 0 && result.passed) {
    console.log(`\n⚠️  Scale gates passed with ${result.warnings.length} warning(s).`);
    return 0;
  }

  return 0;
}

// ─── Built-in Endpoint Inventory ─────────────────────────────────────────────
// These are the P0/P1 endpoints known to the scale gate system.
// New P0 endpoints must be added here before release.

export const KNOWN_P0_ENDPOINTS: GateContext[] = [
  // Public content
  { endpoint: "/api/v1/services", method: "GET", priority: "P0" },
  { endpoint: "/api/v1/projects", method: "GET", priority: "P0" },
  { endpoint: "/api/v1/team", method: "GET", priority: "P0" },
  { endpoint: "/api/v1/blog", method: "GET", priority: "P1" },
  { endpoint: "/api/v1/testimonials", method: "GET", priority: "P1" },
  { endpoint: "/api/v1/pricing", method: "GET", priority: "P1" },
  // Auth
  { endpoint: "/api/admin/auth/login", method: "POST", priority: "P0" },
  { endpoint: "/api/admin/auth/me", method: "GET", priority: "P0" },
  // Orders (critical)
  { endpoint: "/api/orders", method: "POST", priority: "P0" },
  { endpoint: "/api/admin/orders", method: "GET", priority: "P0" },
  { endpoint: "/api/admin/orders", method: "POST", priority: "P0" },
  { endpoint: "/api/admin/orders", method: "PUT", priority: "P0" },
  { endpoint: "/api/orders/:id/messages", method: "GET", priority: "P1" },
  { endpoint: "/api/orders/:id/messages", method: "POST", priority: "P1" },
  // LP
  { endpoint: "/api/lp/redeem", method: "POST", priority: "P0" },
  { endpoint: "/api/admin/lp-awards", method: "POST", priority: "P0" },
  // Academy
  { endpoint: "/api/academy/enroll", method: "POST", priority: "P0" },
  { endpoint: "/api/v1/courses", method: "GET", priority: "P1" },
  // Analytics (heavy — must be async)
  { endpoint: "/api/admin/dashboard", method: "GET", priority: "P0" },
  { endpoint: "/api/admin/analytics", method: "GET", priority: "P1" },
  // Reports / Export — must be async
  { endpoint: "/api/admin/reports", method: "POST", priority: "P1" },
];
