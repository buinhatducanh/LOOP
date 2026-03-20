/**
 * Server-side analytics event storage and aggregation.
 *
 * ## Prisma Migration
 *
 * Add the following model to your Prisma schema, then run `prisma migrate dev`:
 *
 * ```prisma
 * model ServerAnalyticsEvent {
 *   id        String   @id @default(cuid())
 *   event     String
 *   properties Json    @default("{}")
 *   sessionId String?  @map("session_id")
 *   visitorId String? @map("visitor_id")
 *   userId    String? @map("user_id")
 *   locale    String?
 *   page      String?
 *   referrer  String?
 *   userAgent String? @map("user_agent")
 *   ip        String?
 *   country   String?
 *   city      String?
 *   device    String?  // desktop, mobile, tablet
 *   browser   String?
 *   os        String?
 *   createdAt DateTime @default(now()) @map("created_at")
 *   @@index([event])
 *   @@index([createdAt])
 *   @@index([sessionId])
 *   @@map("server_analytics_events")
 * }
 * ```
 *
 * Usage:
 * ```ts
 * import { storeEvent, getAnalytics } from "@/lib/analytics/server";
 *
 * // Store an event (fire-and-forget)
 * await storeEvent("page_view", { path: "/services" }, request);
 *
 * // Query analytics
 * const stats = await getAnalytics({ days: 30 });
 * ```
 */

import { prisma } from "@/lib/prisma";

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface EventContext {
  sessionId?: string | null;
  visitorId?: string | null;
  userId?: string | null;
  locale?: string | null;
  page?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
  ip?: string | null;
  country?: string | null;
  city?: string | null;
  device?: string | null;
  browser?: string | null;
  os?: string | null;
}

export interface GetAnalyticsOptions {
  /** Number of days to look back. Defaults to 30. */
  days?: number;
  /** Start date (overrides days). */
  startDate?: Date;
  /** End date. Defaults to now. */
  endDate?: Date;
  /** Filter by event name(s). */
  event?: string | string[];
  /** Filter by locale. */
  locale?: string;
  /** Filter by page path prefix. */
  pagePrefix?: string;
}

export interface AnalyticsOverview {
  totalEvents: number;
  uniqueSessions: number;
  uniqueVisitors: number;
  bounceRate: number;
  topEvents: Array<{ event: string; count: bigint }>;
  eventsByDay: Array<{ date: string; count: bigint }>;
  eventsByLocale: Array<{ locale: string; count: bigint }>;
  topPages: Array<{ page: string; count: bigint }>;
  topDevices: Array<{ device: string; count: bigint }>;
  topCountries: Array<{ country: string; count: bigint }>;
  topBrowsers: Array<{ browser: string; count: bigint }>;
}

export interface PageAnalytics {
  page: string;
  totalViews: number;
  uniqueSessions: number;
  uniqueVisitors: number;
  bounceRate: number;
  eventsByDay: Array<{ date: string; count: bigint }>;
  topReferrers: Array<{ referrer: string; count: bigint }>;
  topLocales: Array<{ locale: string; count: bigint }>;
}

export interface FunnelStep {
  event: string;
  label?: string;
}

export interface ConversionFunnelStep {
  event: string;
  label: string;
  totalCount: number;
  conversionRate: number; // percentage relative to first step
}

export interface RealTimeStats {
  eventsLast5Min: number;
  eventsLast15Min: number;
  eventsLast30Min: number;
  activeSessions: number;
  topEventsNow: Array<{ event: string; count: number }>;
}

/* ─── storeEvent ─────────────────────────────────────────────────────────── */

/**
 * Persist a single analytics event to the database.
 *
 * Designed to be fire-and-forget — errors are swallowed so tracking never
 * blocks or breaks the user-facing request. Wrap in a background job queue
 * (e.g. Inngest, Trigger.dev) for high-throughput production use.
 *
 * @param event     - Canonical event name (e.g. "page_view", "cta_click")
 * @param properties - Arbitrary key/value payload
 * @param context   - Request context (session, geo, device, etc.)
 */
export async function storeEvent(
  event: string,
  properties: Record<string, string | number | boolean | null> = {},
  context: EventContext = {}
): Promise<void> {
  try {
    await prisma.serverAnalyticsEvent.create({
      data: {
        event,
        properties: properties as Record<string, unknown>,
        sessionId: context.sessionId ?? null,
        visitorId: context.visitorId ?? null,
        userId: context.userId ?? null,
        locale: context.locale ?? null,
        page: context.page ?? null,
        referrer: context.referrer ?? null,
        userAgent: context.userAgent ?? null,
        ip: context.ip ?? null,
        country: context.country ?? null,
        city: context.city ?? null,
        device: context.device ?? null,
        browser: context.browser ?? null,
        os: context.os ?? null,
      },
    });
  } catch (err) {
    // Swallow errors — analytics must never affect user experience.
    // In production, forward to an error tracker (Sentry, etc.).
    console.error("[analytics/storeEvent]", err);
  }
}

/**
 * Fire-and-forget variant — does not await the database write.
 * Use this when you want zero overhead on the calling code path.
 *
 * @example
 * ```ts
 * // In an API route:
 * fireEvent("page_view", { path: req.nextUrl.pathname }, extractContext(req));
 * return NextResponse.json({ ok: true });
 * ```
 */
export function fireEvent(
  event: string,
  properties: Record<string, string | number | boolean | null> = {},
  context: EventContext = {}
): void {
  // Detach the promise so it runs after the response is sent.
  void storeEvent(event, properties, context).catch(() => {
    // already handled inside storeEvent
  });
}

/* ─── getAnalytics ──────────────────────────────────────────────────────── */

/**
 * Return a high-level analytics overview for the given time window.
 *
 * Aggregates event counts, unique sessions/visitors, bounce rate, and
 * breakdowns by day, locale, page, device, country, and browser.
 */
export async function getAnalytics(
  options: GetAnalyticsOptions = {}
): Promise<AnalyticsOverview> {
  try {
    const days = options.days ?? 30;
    const endDate = options.endDate ?? new Date();
    const startDate =
      options.startDate ?? new Date(Date.now() - days * 86_400_000);

    const where = buildWhereClause({ ...options, startDate, endDate });

    // Run all queries in parallel for speed.
    const [totalResult, uniqueSessionsResult, uniqueVisitorsResult,
      topEventsResult, eventsByDayResult, eventsByLocaleResult,
      topPagesResult, topDevicesResult, topCountriesResult,
      topBrowsersResult, bounceRateResult] = await Promise.all([
      prisma.serverAnalyticsEvent.count({ where }),
      prisma.serverAnalyticsEvent
        .groupBy({ by: ["sessionId"], where: { sessionId: { not: null } } })
        .then((rows) => rows.filter((r) => r.sessionId !== null).length),
      prisma.serverAnalyticsEvent
        .groupBy({ by: ["visitorId"], where: { visitorId: { not: null } } })
        .then((rows) => rows.filter((r) => r.visitorId !== null).length),
      prisma.serverAnalyticsEvent.groupBy({
        by: ["event"],
        _count: { event: true },
        where,
        orderBy: { _count: { event: "desc" } },
        take: 10,
      }),
      queryEventsByDay(startDate, endDate, where),
      prisma.serverAnalyticsEvent.groupBy({
        by: ["locale"],
        _count: { event: true },
        where: { ...where, locale: { not: null } },
        orderBy: { _count: { event: "desc" } },
        take: 20,
      }),
      prisma.serverAnalyticsEvent.groupBy({
        by: ["page"],
        _count: { event: true },
        where: { ...where, page: { not: null } },
        orderBy: { _count: { event: "desc" } },
        take: 10,
      }),
      prisma.serverAnalyticsEvent.groupBy({
        by: ["device"],
        _count: { event: true },
        where: { ...where, device: { not: null } },
        orderBy: { _count: { event: "desc" } },
      }),
      prisma.serverAnalyticsEvent.groupBy({
        by: ["country"],
        _count: { event: true },
        where: { ...where, country: { not: null } },
        orderBy: { _count: { event: "desc" } },
        take: 15,
      }),
      prisma.serverAnalyticsEvent.groupBy({
        by: ["browser"],
        _count: { event: true },
        where: { ...where, browser: { not: null } },
        orderBy: { _count: { event: "desc" } },
        take: 10,
      }),
      calculateBounceRate(where),
    ]);

    return {
      totalEvents: totalResult,
      uniqueSessions: uniqueSessionsResult,
      uniqueVisitors: uniqueVisitorsResult,
      bounceRate: bounceRateResult,
      topEvents: topEventsResult.map((r) => ({
        event: r.event,
        count: r._count.event,
      })),
      eventsByDay: eventsByDayResult,
      eventsByLocale: eventsByLocaleResult.map((r) => ({
        locale: r.locale ?? "unknown",
        count: r._count.event,
      })),
      topPages: topPagesResult.map((r) => ({
        page: r.page ?? "unknown",
        count: r._count.event,
      })),
      topDevices: topDevicesResult.map((r) => ({
        device: r.device ?? "unknown",
        count: r._count.event,
      })),
      topCountries: topCountriesResult.map((r) => ({
        country: r.country ?? "unknown",
        count: r._count.event,
      })),
      topBrowsers: topBrowsersResult.map((r) => ({
        browser: r.browser ?? "unknown",
        count: r._count.event,
      })),
    };
  } catch (err) {
    console.error("[analytics/getAnalytics]", err);
    return emptyOverview();
  }
}

/* ─── getPageAnalytics ─────────────────────────────────────────────────── */

/**
 * Return per-page analytics for a specific route path.
 *
 * @param pagePath - Exact page path (e.g. "/services/seo")
 * @param days     - Number of days to look back. Defaults to 30.
 */
export async function getPageAnalytics(
  pagePath: string,
  days = 30
): Promise<PageAnalytics> {
  try {
    const startDate = new Date(Date.now() - days * 86_400_000);
    const endDate = new Date();

    const where = {
      page: pagePath,
      createdAt: { gte: startDate, lte: endDate },
    };

    const [
      totalViews,
      uniqueSessionsResult,
      uniqueVisitorsResult,
      eventsByDayResult,
      topReferrersResult,
      topLocalesResult,
      bounceRate,
    ] = await Promise.all([
      prisma.serverAnalyticsEvent.count({ where }),
      prisma.serverAnalyticsEvent
        .groupBy({ by: ["sessionId"], where: { ...where, sessionId: { not: null } } })
        .then((rows) => rows.filter((r) => r.sessionId !== null).length),
      prisma.serverAnalyticsEvent
        .groupBy({ by: ["visitorId"], where: { ...where, visitorId: { not: null } } })
        .then((rows) => rows.filter((r) => r.visitorId !== null).length),
      queryEventsByDay(startDate, endDate, where),
      prisma.serverAnalyticsEvent.groupBy({
        by: ["referrer"],
        _count: { event: true },
        where: { ...where, referrer: { not: null } },
        orderBy: { _count: { event: "desc" } },
        take: 10,
      }),
      prisma.serverAnalyticsEvent.groupBy({
        by: ["locale"],
        _count: { event: true },
        where: { ...where, locale: { not: null } },
        orderBy: { _count: { event: "desc" } },
        take: 10,
      }),
      calculateBounceRate(where),
    ]);

    return {
      page: pagePath,
      totalViews,
      uniqueSessions: uniqueSessionsResult,
      uniqueVisitors: uniqueVisitorsResult,
      bounceRate,
      eventsByDay: eventsByDayResult,
      topReferrers: topReferrersResult.map((r) => ({
        referrer: r.referrer ?? "direct",
        count: r._count.event,
      })),
      topLocales: topLocalesResult.map((r) => ({
        locale: r.locale ?? "unknown",
        count: r._count.event,
      })),
    };
  } catch (err) {
    console.error("[analytics/getPageAnalytics]", err);
    return {
      page: pagePath,
      totalViews: 0,
      uniqueSessions: 0,
      uniqueVisitors: 0,
      bounceRate: 0,
      eventsByDay: [],
      topReferrers: [],
      topLocales: [],
    };
  }
}

/* ─── getConversionFunnel ──────────────────────────────────────────────── */

/**
 * Compute a conversion funnel across an ordered list of event steps.
 *
 * A session "completes" a step if it contains at least one event matching
 * that step's `event` name.  Sessions that reach a later step are counted
 * as having passed all prior steps (even if they don't have those events).
 * This is a common "relaxed" funnel model; each step's denominator is the
 * count of the previous step.
 *
 * @param steps - Ordered array of funnel steps. First step = top of funnel.
 * @param days  - Number of days to look back. Defaults to 30.
 *
 * @example
 * ```ts
 * const funnel = await getConversionFunnel([
 *   { event: "page_view",    label: "Visited Site" },
 *   { event: "service_viewed", label: "Viewed Service" },
 *   { event: "cta_click",    label: "Clicked CTA" },
 *   { event: "quote_request", label: "Requested Quote" },
 * ], 30);
 * ```
 */
export async function getConversionFunnel(
  steps: FunnelStep[],
  days = 30
): Promise<ConversionFunnelStep[]> {
  if (steps.length === 0) return [];

  try {
    const startDate = new Date(Date.now() - days * 86_400_000);

    // Fetch all events in the window to process in memory.
    // For very large datasets, replace with raw SQL.
    const events = await prisma.serverAnalyticsEvent.findMany({
      where: {
        event: { in: steps.map((s) => s.event) },
        createdAt: { gte: startDate },
      },
      select: { sessionId: true, event: true },
    });

    // Group events by session.
    const sessionEvents = new Map<string, Set<string>>();
    for (const row of events) {
      if (!row.sessionId) continue;
      if (!sessionEvents.has(row.sessionId)) {
        sessionEvents.set(row.sessionId, new Set());
      }
      sessionEvents.get(row.sessionId)!.add(row.event);
    }

    // Count sessions that completed each step (have at least one matching event).
    const stepCounts = new Map<string, number>();
    for (const step of steps) {
      let count = 0;
      for (const [, eventSet] of sessionEvents) {
        if (eventSet.has(step.event)) count++;
      }
      stepCounts.set(step.event, count);
    }

    const firstCount = stepCounts.get(steps[0].event) ?? 0;

    return steps.map((step) => {
      const totalCount = stepCounts.get(step.event) ?? 0;
      return {
        event: step.event,
        label: step.label ?? step.event,
        totalCount,
        conversionRate:
          firstCount > 0
            ? Math.round((totalCount / firstCount) * 10_000) / 100
            : 0,
      };
    });
  } catch (err) {
    console.error("[analytics/getConversionFunnel]", err);
    return steps.map((step) => ({
      event: step.event,
      label: step.label ?? step.event,
      totalCount: 0,
      conversionRate: 0,
    }));
  }
}

/* ─── getSessionData ────────────────────────────────────────────────────── */

/**
 * Retrieve every event associated with a given session.
 *
 * @param sessionId - The analytics session ID (not the auth session).
 * @param limit     - Maximum events to return. Defaults to 500.
 */
export async function getSessionData(
  sessionId: string,
  limit = 500
): Promise<Array<{
  id: string;
  event: string;
  properties: Record<string, unknown>;
  page: string | null;
  locale: string | null;
  device: string | null;
  createdAt: Date;
}>> {
  try {
    return await prisma.serverAnalyticsEvent.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: {
        id: true,
        event: true,
        properties: true,
        page: true,
        locale: true,
        device: true,
        createdAt: true,
      },
    });
  } catch (err) {
    console.error("[analytics/getSessionData]", err);
    return [];
  }
}

/* ─── getRealTimeStats ──────────────────────────────────────────────────── */

/**
 * Return near-real-time event statistics.
 *
 * @returns Aggregated event counts for the last 5, 15, and 30 minutes,
 *          plus the number of distinct active sessions and the top
 *          currently-firing events.
 */
export async function getRealTimeStats(): Promise<RealTimeStats> {
  try {
    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60_000);
    const fifteenMinAgo = new Date(now.getTime() - 15 * 60_000);
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60_000);

    const [
      eventsLast5Min,
      eventsLast15Min,
      eventsLast30Min,
      activeSessionResult,
      topEventsNowResult,
    ] = await Promise.all([
      prisma.serverAnalyticsEvent.count({
        where: { createdAt: { gte: fiveMinAgo } },
      }),
      prisma.serverAnalyticsEvent.count({
        where: { createdAt: { gte: fifteenMinAgo } },
      }),
      prisma.serverAnalyticsEvent.count({
        where: { createdAt: { gte: thirtyMinAgo } },
      }),
      prisma.serverAnalyticsEvent
        .groupBy({
          by: ["sessionId"],
          where: {
            createdAt: { gte: fiveMinAgo },
            sessionId: { not: null },
          },
        })
        .then((rows) => rows.filter((r) => r.sessionId !== null).length),
      prisma.serverAnalyticsEvent.groupBy({
        by: ["event"],
        _count: { event: true },
        where: { createdAt: { gte: fiveMinAgo } },
        orderBy: { _count: { event: "desc" } },
        take: 5,
      }),
    ]);

    return {
      eventsLast5Min,
      eventsLast15Min,
      eventsLast30Min,
      activeSessions: activeSessionResult,
      topEventsNow: topEventsNowResult.map((r) => ({
        event: r.event,
        count: r._count.event,
      })),
    };
  } catch (err) {
    console.error("[analytics/getRealTimeStats]", err);
    return {
      eventsLast5Min: 0,
      eventsLast15Min: 0,
      eventsLast30Min: 0,
      activeSessions: 0,
      topEventsNow: [],
    };
  }
}

/* ─── cleanupOldEvents ───────────────────────────────────────────────────── */

/**
 * Delete analytics events older than `daysToKeep`.
 *
 * Useful for GDPR compliance ("right to deletion") and routine data hygiene.
 * Uses batch deletes to avoid long-running transactions on large tables.
 *
 * @param daysToKeep - Retain events from the last N days. Default: 365.
 * @returns Total number of events deleted.
 */
export async function cleanupOldEvents(
  daysToKeep = 365
): Promise<{ deleted: number }> {
  try {
    const cutoff = new Date(Date.now() - daysToKeep * 86_400_000);
    let totalDeleted = 0;
    const BATCH_SIZE = 5000;

    while (true) {
      const result = await prisma.serverAnalyticsEvent.deleteMany({
        where: { createdAt: { lt: cutoff } },
        take: BATCH_SIZE,
      });
      totalDeleted += result.count;
      if (result.count < BATCH_SIZE) break;
    }

    return { deleted: totalDeleted };
  } catch (err) {
    console.error("[analytics/cleanupOldEvents]", err);
    return { deleted: 0 };
  }
}

/* ─── Internal helpers ──────────────────────────────────────────────────── */

type EventWhereInput = Parameters<
  typeof prisma.serverAnalyticsEvent.count
>[0]["where"];

function buildWhereClause(
  options: GetAnalyticsOptions & { startDate: Date; endDate: Date }
): EventWhereInput {
  const where: EventWhereInput = {
    createdAt: { gte: options.startDate, lte: options.endDate },
  };

  if (options.event) {
    where.event =
      typeof options.event === "string"
        ? options.event
        : { in: options.event };
  }

  if (options.locale) where.locale = options.locale;
  if (options.pagePrefix) where.page = { startsWith: options.pagePrefix };

  return where;
}

async function queryEventsByDay(
  startDate: Date,
  endDate: Date,
  where: EventWhereInput
): Promise<Array<{ date: string; count: bigint }>> {
  try {
    // Use raw SQL for efficient date truncation — avoids loading all rows into JS.
    const rows = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT
        DATE(created_at AT TIME ZONE 'UTC') AS date,
        COUNT(*)::bigint AS count
      FROM server_analytics_events
      WHERE created_at >= ${startDate}
        AND created_at <= ${endDate}
        ${whereClauseToSql(where)}
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    return rows;
  } catch {
    // Fallback: group in JS if raw SQL isn't available.
    const rows = await prisma.serverAnalyticsEvent.groupBy({
      by: ["createdAt"],
      _count: { event: true },
      where,
      orderBy: { createdAt: "asc" },
    });

    // Group by calendar date in UTC.
    const byDate = new Map<string, bigint>();
    for (const row of rows) {
      const dateStr = row.createdAt.toISOString().slice(0, 10);
      byDate.set(dateStr, (byDate.get(dateStr) ?? 0n) + BigInt(row._count.event));
    }

    return Array.from(byDate.entries())
      .sort()
      .map(([date, count]) => ({ date, count }));
  }
}

async function calculateBounceRate(where: EventWhereInput): Promise<number> {
  try {
    // A "bounced" session = exactly 1 event (single-page visit).
    // Bounce rate = bounced sessions / total sessions.
    const sessions = await prisma.serverAnalyticsEvent.groupBy({
      by: ["sessionId"],
      _count: { event: true },
      where: { ...where, sessionId: { not: null } },
    });

    const totalSessions = sessions.filter((s) => s.sessionId !== null).length;
    if (totalSessions === 0) return 0;

    const bouncedSessions = sessions.filter(
      (s) => s.sessionId !== null && s._count.event === 1
    ).length;

    return Math.round((bouncedSessions / totalSessions) * 10_000) / 100;
  } catch {
    return 0;
  }
}

/**
 * Minimal SQL fragment builder for the raw query in queryEventsByDay.
 * Handles only the fields we actually use in that query.
 */
function whereClauseToSql(
  where: EventWhereInput
): string {
  const conditions: string[] = [];
  if (where.event) {
    if (typeof where.event === "string") {
      conditions.push(`event = '${where.event.replace(/'/g, "''")}'`);
    } else if ("in" in where.event) {
      const list = (where.event.in as string[])
        .map((v) => `'${v.replace(/'/g, "''")}'`)
        .join(",");
      conditions.push(`event IN (${list})`);
    }
  }
  if (where.locale) {
    conditions.push(`locale = '${where.locale.replace(/'/g, "''")}'`);
  }
  if (where.page && typeof where.page === "object" && "startsWith" in where.page) {
    conditions.push(
      `page LIKE '${(where.page.startsWith as string).replace(/'/g, "''")}%'`
    );
  }
  return conditions.length > 0 ? ` AND ${conditions.join(" AND ")}` : "";
}

function emptyOverview(): AnalyticsOverview {
  return {
    totalEvents: 0,
    uniqueSessions: 0,
    uniqueVisitors: 0,
    bounceRate: 0,
    topEvents: [],
    eventsByDay: [],
    eventsByLocale: [],
    topPages: [],
    topDevices: [],
    topCountries: [],
    topBrowsers: [],
  };
}
