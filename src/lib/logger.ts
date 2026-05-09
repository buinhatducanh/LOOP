/**
 * Structured logger for LOOP platform.
 *
 * Features:
 * - JSON output in production (machine-readable)
 * - Human-readable in development
 * - Redacts sensitive fields
 * - Sentry integration for error-level logs
 * - SLO-aware log fields
 *
 * Usage:
 *   import { logger } from "@/lib/logger"
 *   logger.info("Order created", { orderId: "123", total: 500000 })
 *   logger.error("Payment failed", { orderId: "123", error: err.message })
 *
 * In API routes, prefer structured fields over embedding in message string.
 * SLO fields are included automatically for P0/P1 endpoints.
 */

import * as Sentry from "@sentry/nextjs";
import { METRICS } from "./slo";

// ─── Log Levels ───────────────────────────────────────────────────────────────

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ─── Sensitive Fields ────────────────────────────────────────────────────────
// Fields matching these keys are redacted in all log output.
// Keys are case-insensitive.

const REDACTED_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
  "api_key",
  "apikey",
  "auth",
  "creditcard",
  "ccnumber",
  "ssn",
  "email", // redact full email — log only domain
  "phone",
  "address",
  "name", // redact full name — log only first name
  "id_token",
  "access_token",
  "refresh_token",
]);

/**
 * Redact sensitive values from an object.
 * Returns a shallow copy with redacted fields replaced.
 */
function redactSensitiveFields(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    if (REDACTED_KEYS.has(lowerKey)) {
      if (lowerKey === "email" && typeof value === "string") {
        // Redact email, keep domain for debugging
        const domain = value.split("@")[1];
        result[key] = domain ? `***@${domain}` : "***";
      } else if (lowerKey === "name" && typeof value === "string") {
        // Redact name, keep first word for context
        const firstName = value.split(" ")[0];
        result[key] = firstName ? `${firstName} ***` : "***";
      } else {
        result[key] = "[REDACTED]";
      }
    } else if (typeof value === "object" && value !== null) {
      result[key] = redactSensitiveFields(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}

// ─── Log Entry Shape ──────────────────────────────────────────────────────────

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  // Nesting for structured context
  [key: string]: unknown;
}

export interface LoggerOptions {
  /** Override log level (e.g., "debug" in dev, "info" in prod) */
  level?: LogLevel;
  /** Additional static fields merged into every log entry */
  defaultFields?: Record<string, unknown>;
  /** Module name for log attribution */
  module?: string;
}

// ─── Logger Class ─────────────────────────────────────────────────────────────

export class Logger {
  private level: LogLevel;
  private defaultFields: Record<string, unknown>;
  private module: string;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? (process.env.NODE_ENV === "production" ? "info" : "debug");
    this.defaultFields = options.defaultFields ?? {};
    this.module = options.module ?? "app";
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.level];
  }

  private format(entry: LogEntry): string {
    if (process.env.NODE_ENV === "production") {
      return JSON.stringify(entry);
    }
    // Development: readable format
    const timestamp = entry.timestamp.split("T")[1]?.split(".")[0] ?? entry.timestamp;
    const context = Object.entries(entry)
      .filter(([k]) => k !== "timestamp" && k !== "level" && k !== "message")
      .map(([k, v]: [string, unknown]) => `${k}=${JSON.stringify(v)}`)
      .join(" ");
    return `[${timestamp}] ${entry.level.toUpperCase()} [${this.module}] ${entry.message} ${context}`;
  }

  private log(level: LogLevel, message: string, context: Record<string, unknown> = {}) {
    if (!this.shouldLog(level)) return;

    const merged = {
      ...this.defaultFields,
      ...redactSensitiveFields(context),
    };

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      module: this.module,
      ...merged,
    };

    const output = this.format(entry);

    if (level === "error") {
      console.error(output);
    } else if (level === "warn") {
      console.warn(output);
    } else {
      console.log(output);
    }

    // Forward error-level logs to Sentry
    if (level === "error" && process.env.NODE_ENV === "production") {
      Sentry.captureMessage(message, {
        level: "error",
        extra: merged,
      });
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log("error", message, context);
  }

  /**
   * Create a child logger with additional default fields.
   * Useful for tagging logs from a specific domain (e.g., orders, auth).
   */
  child(fields: Record<string, unknown>, module?: string): Logger {
    return new Logger({
      level: this.level,
      defaultFields: { ...this.defaultFields, ...fields },
      module: module ?? this.module,
    });
  }

  /**
   * Log SLO-relevant metrics for P0/P1 operations.
   * Adds SLO context fields automatically.
   */
  withSLO(
    message: string,
    context: Record<string, unknown> & {
      endpoint?: string;
      latencyMs?: number;
      statusCode?: number;
      userId?: string;
    }
  ) {
    const { endpoint, latencyMs, statusCode, ...rest } = context;

    const sloContext: Record<string, unknown> = {
      ...rest,
      ...(endpoint ? { endpoint } : {}),
      ...(latencyMs !== undefined
        ? {
            latencyMs,
            slo_p95_breach:
              latencyMs > METRICS.PUBLIC_API_P95.threshold,
          }
        : {}),
      ...(statusCode !== undefined
        ? {
            statusCode,
            is_error: statusCode >= 500,
            is_client_error: statusCode >= 400 && statusCode < 500,
          }
        : {}),
    };

    const level: LogLevel =
      statusCode !== undefined && statusCode >= 500
        ? "error"
        : latencyMs !== undefined &&
          latencyMs > METRICS.PUBLIC_API_P95.threshold
          ? "warn"
          : "info";

    this.log(level, message, sloContext);
  }
}

// ─── Singleton Export ──────────────────────────────────────────────────────────

export const logger = new Logger({
  module: "loop",
  level:
    process.env.LOG_LEVEL as LogLevel ??
    (process.env.NODE_ENV === "production" ? "info" : "debug"),
});

// Convenience exports for domain-specific loggers
export const orderLogger = logger.child({ domain: "orders" }, "orders");
export const authLogger = logger.child({ domain: "auth" }, "auth");
export const academyLogger = logger.child({ domain: "academy" }, "academy");
export const lpLogger = logger.child({ domain: "lp" }, "lp");
export const queueLogger = logger.child({ domain: "queue" }, "queue");
