/**
 * Pre-computed analytics helpers for dashboard display.
 *
 * These functions are optimised for dashboard pages: they aggregate raw
 * events into human-readable metrics, performantly returning only the
 * numbers the UI needs.
 *
 * All functions are async, fully typed, and return sensible defaults
 * (empty arrays / zero) on database errors so dashboards never crash.
 *
 * Usage:
 * ```ts
 * import { fetchDailyStats, buildDashboardSummary } from "@/lib/analytics/aggregations";
 *
 * const stats = await fetchDailyStats(30);
 * const summary = await buildDashboardSummary();
 * ```
 */

import { prisma } from "@/lib/prisma";

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface DailyStats {
  /** Calendar date (YYYY-MM-DD, UTC) */
  date: string;
  /** Total page_view events on this day */
  pageViews: number;
  /** Distinct session IDs that had at least one event */
  sessions: number;
  /** Bounced sessions (exactly 1 event) / total sessions, as a percentage */
  bounceRate: number;
  /** Total events of any type */
  totalEvents: number;
}

export interface TopPage {
  page: string;
  views: number;
  uniqueSessions: number;
  uniqueVisitors: number;
}

export interface TopEvent {
  event: string;
  count: number;
}

export interface GeoStat {
  country: string | null;
  city: string | null;
  views: number;
  sessions: number;
  percentage: number;
}

export interface DeviceStat {
  device: string;
  views: number;
  percentage: number;
}

export interface ReferrerStat {
  referrer: string;
  /** Cleaned display name (domain or "Direct") */
  label: string;
  views: number;
  sessions: number;
  percentage: number;
}

export interface ConversionRate {
  totalSessions: number;
  quoteRequestSessions: number;
  formSubmissionSessions: number;
  quoteRequestRate: number;
  formSubmissionRate: number;
}

export interface DashboardSummary {
  /** Rolling totals */
  totalEvents: number;
  totalSessions: number;
  totalVisitors: number;
  overallBounceRate: number;
  /** Last 7 days */
  dailyStats: DailyStats[];
  topPages: TopPage[];
  topEvents: TopEvent[];
  geoStats: GeoStat[];
  deviceStats: DeviceStat[];
  referrerStats: ReferrerStat[];
  conversionRate: ConversionRate;
  /** Timestamps */
  generatedAt: Date;
  periodDays: number;
}

/* ─── fetchDailyStats ───────────────────────────────────────────────────── */

/**
 * Return daily pageview and session counts for the last N days.
 *
 * Uses a single raw SQL query for efficiency (avoids N database round-trips
 * and lets Postgres do the date bucketing).
 *
 * @param days - Number of calendar days to include. Defaults to 30.
 */
export async function fetchDailyStats(
  days = 30
): Promise<DailyStats[]> {
  try {
    const startDate = new Date(Date.now() - days * 86_400_000);

    const rows = await prisma.$queryRaw<Array<{
      date: Date;
      page_views: bigint;
      total_events: bigint;
    }>>`
      SELECT
        DATE(created_at AT TIME ZONE 'UTC')       AS date,
        COUNT(*) FILTER (WHERE event = 'page_view') AS page_views,
        COUNT(*)                                   AS total_events
      FROM server_analytics_events
      WHERE created_at >= ${startDate}
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    // Fetch session counts separately (groupBy can't be combined with FILTER in raw SQL here).
    const sessionRows = await prisma.$queryRaw<Array<{
      date: Date;
      session_count: bigint;
      bounced_count: bigint;
    }>>`
      SELECT
        DATE(e.created_at AT TIME ZONE 'UTC')  AS date,
        COUNT(DISTINCT e.session_id)           AS session_count,
        COUNT(*) FILTER (
          WHERE sub.cnt = 1 AND e.session_id IS NOT NULL
        )                                      AS bounced_count
      FROM server_analytics_events e
      LEFT JOIN LATERAL (
        SELECT session_id, COUNT(*) AS cnt
        FROM server_analytics_events
        WHERE session_id = e.session_id
          AND created_at >= ${startDate}
        GROUP BY session_id
      ) sub ON sub.session_id = e.session_id
      WHERE e.created_at >= ${startDate}
        AND e.session_id IS NOT NULL
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    const sessionMap = new Map<string, { sessions: number; bounced: number }>();
    for (const row of sessionRows) {
      sessionMap.set(row.date.toISOString().slice(0, 10), {
        sessions: Number(row.session_count),
        bounced: Number(row.bounced_count),
      });
    }

    return rows.map((row) => {
      const dateStr = row.date.toISOString().slice(0, 10);
      const { sessions = 0, bounced = 0 } = sessionMap.get(dateStr) ?? {};
      const bounceRate = sessions > 0 ? Math.round((bounced / sessions) * 10_000) / 100 : 0;

      return {
        date: dateStr,
        pageViews: Number(row.page_views),
        sessions,
        bounceRate,
        totalEvents: Number(row.total_events),
      };
    });
  } catch (err) {
    console.error("[analytics/fetchDailyStats]", err);
    return [];
  }
}

/* ─── fetchTopPages ─────────────────────────────────────────────────────── */

/**
 * Return the most-viewed pages (by total page_view events).
 *
 * @param limit - Number of pages to return. Defaults to 10.
 */
export async function fetchTopPages(limit = 10): Promise<TopPage[]> {
  try {
    const rows = await prisma.serverAnalyticsEvent.groupBy({
      by: ["page"],
      _count: { event: true },
      _countSessions: { event: true },
      where: {
        page: { not: null },
        event: "page_view",
      },
      orderBy: { _count: { event: "desc" } },
      take: limit,
    });

    // Distinct sessions per page requires a separate query.
    const sessionCounts = await prisma.$queryRaw<Array<{
      page: string;
      unique_sessions: bigint;
      unique_visitors: bigint;
    }>>`
      SELECT
        page,
        COUNT(DISTINCT session_id)          AS unique_sessions,
        COUNT(DISTINCT visitor_id) FILTER (WHERE visitor_id IS NOT NULL) AS unique_visitors
      FROM server_analytics_events
      WHERE page IS NOT NULL AND event = 'page_view'
      GROUP BY page
      ORDER BY COUNT(*) DESC
      LIMIT ${limit}
    `;

    const sessionMap = new Map<string, { sessions: number; visitors: number }>();
    for (const row of sessionCounts) {
      sessionMap.set(row.page, {
        sessions: Number(row.unique_sessions),
        visitors: Number(row.unique_visitors),
      });
    }

    return rows.map((r) => {
      const page = r.page ?? "unknown";
      const { sessions = 0, visitors = 0 } = sessionMap.get(page) ?? {};
      return {
        page,
        views: r._count.event,
        uniqueSessions: sessions,
        uniqueVisitors: visitors,
      };
    });
  } catch (err) {
    console.error("[analytics/fetchTopPages]", err);
    return [];
  }
}

/* ─── fetchTopEvents ────────────────────────────────────────────────────── */

/**
 * Return the most-fired event names across all time (or the last N days).
 *
 * @param limit - Number of event types to return. Defaults to 10.
 * @param days  - Optional lookback window in days.
 */
export async function fetchTopEvents(
  limit = 10,
  days?: number
): Promise<TopEvent[]> {
  try {
    const where: { event?: string; createdAt?: { gte: Date } } = {};
    if (days) where.createdAt = { gte: new Date(Date.now() - days * 86_400_000) };

    const rows = await prisma.serverAnalyticsEvent.groupBy({
      by: ["event"],
      _count: { event: true },
      where,
      orderBy: { _count: { event: "desc" } },
      take: limit,
    });

    return rows.map((r) => ({
      event: r.event,
      count: r._count.event,
    }));
  } catch (err) {
    console.error("[analytics/fetchTopEvents]", err);
    return [];
  }
}

/* ─── fetchGeoStats ─────────────────────────────────────────────────────── */

/**
 * Return visits grouped by country and city.
 * Requires IP-to-geo enrichment to have been stored on events (see `storeEvent`).
 *
 * @param limit - Number of top locations to return. Defaults to 20.
 */
export async function fetchGeoStats(limit = 20): Promise<GeoStat[]> {
  try {
    const rows = await prisma.$queryRaw<Array<{
      country: string | null;
      city: string | null;
      views: bigint;
      sessions: bigint;
    }>>`
      SELECT
        country,
        city,
        COUNT(*)                                    AS views,
        COUNT(DISTINCT session_id) FILTER (WHERE session_id IS NOT NULL) AS sessions
      FROM server_analytics_events
      WHERE country IS NOT NULL
      GROUP BY country, city
      ORDER BY views DESC
      LIMIT ${limit}
    `;

    // Compute total for percentage.
    const totalViews = rows.reduce((sum, r) => sum + Number(r.views), 0);

    return rows.map((r) => ({
      country: r.country,
      city: r.city,
      views: Number(r.views),
      sessions: Number(r.sessions),
      percentage:
        totalViews > 0
          ? Math.round((Number(r.views) / totalViews) * 10_000) / 100
          : 0,
    }));
  } catch (err) {
    console.error("[analytics/fetchGeoStats]", err);
    return [];
  }
}

/* ─── fetchDeviceStats ──────────────────────────────────────────────────── */

/**
 * Return the breakdown of desktop / mobile / tablet visits.
 */
export async function fetchDeviceStats(): Promise<DeviceStat[]> {
  try {
    const rows = await prisma.serverAnalyticsEvent.groupBy({
      by: ["device"],
      _count: { event: true },
      where: { device: { not: null } },
      orderBy: { _count: { event: "desc" } },
    });

    const total = rows.reduce((sum, r) => sum + Number(r._count.event), 0);

    return rows.map((r) => ({
      device: r.device ?? "unknown",
      views: Number(r._count.event),
      percentage:
        total > 0
          ? Math.round((Number(r._count.event) / total) * 10_000) / 100
          : 0,
    }));
  } catch (err) {
    console.error("[analytics/fetchDeviceStats]", err);
    return [];
  }
}

/* ─── fetchReferrerStats ────────────────────────────────────────────────── */

/**
 * Return traffic source breakdown by referrer domain.
 *
 * Unknown / null referrers are labelled "Direct".
 * External domains are cleaned to their root domain for grouping.
 *
 * @param limit - Maximum sources to return. Defaults to 10.
 */
export async function fetchReferrerStats(limit = 10): Promise<ReferrerStat[]> {
  try {
    const rows = await prisma.$queryRaw<Array<{
      referrer: string | null;
      views: bigint;
      sessions: bigint;
    }>>`
      SELECT
        referrer,
        COUNT(*)                                     AS views,
        COUNT(DISTINCT session_id) FILTER (WHERE session_id IS NOT NULL) AS sessions
      FROM server_analytics_events
      WHERE referrer IS NOT NULL AND referrer != ''
      GROUP BY referrer
      ORDER BY views DESC
      LIMIT ${limit}
    `;

    const totalViews = rows.reduce((sum, r) => sum + Number(r.views), 0);

    return rows.map((r) => {
      const referrer = r.referrer ?? "Direct";
      const label = extractDomain(referrer);

      return {
        referrer,
        label,
        views: Number(r.views),
        sessions: Number(r.sessions),
        percentage:
          totalViews > 0
            ? Math.round((Number(r.views) / totalViews) * 10_000) / 100
            : 0,
      };
    });
  } catch (err) {
    console.error("[analytics/fetchReferrerStats]", err);
    return [];
  }
}

/* ─── fetchConversionRate ───────────────────────────────────────────────── */

/**
 * Calculate conversion rates for quote requests and form submissions.
 *
 * A "converted session" is a session that fired at least one conversion event.
 * The rate is: converted sessions / total sessions × 100.
 *
 * @param days - Number of days to look back. Defaults to 30.
 */
export async function fetchConversionRate(
  days = 30
): Promise<ConversionRate> {
  try {
    const startDate = new Date(Date.now() - days * 86_400_000);

    const [totalSessionsResult, quoteResult, formResult] = await Promise.all([
      // All distinct sessions in the window.
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT session_id)::bigint AS count
        FROM server_analytics_events
        WHERE session_id IS NOT NULL
          AND created_at >= ${startDate}
      `,
      // Sessions that fired quote_request.
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT session_id)::bigint AS count
        FROM server_analytics_events
        WHERE session_id IS NOT NULL
          AND event = 'quote_request'
          AND created_at >= ${startDate}
      `,
      // Sessions that fired form_submission.
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT session_id)::bigint AS count
        FROM server_analytics_events
        WHERE session_id IS NOT NULL
          AND event = 'form_submission'
          AND created_at >= ${startDate}
      `,
    ]);

    const totalSessions = Number(totalSessionsResult[0]?.count ?? 0);
    const quoteRequestSessions = Number(quoteResult[0]?.count ?? 0);
    const formSubmissionSessions = Number(formResult[0]?.count ?? 0);

    const quoteRequestRate =
      totalSessions > 0
        ? Math.round((quoteRequestSessions / totalSessions) * 10_000) / 100
        : 0;
    const formSubmissionRate =
      totalSessions > 0
        ? Math.round((formSubmissionSessions / totalSessions) * 10_000) / 100
        : 0;

    return {
      totalSessions,
      quoteRequestSessions,
      formSubmissionSessions,
      quoteRequestRate,
      formSubmissionRate,
    };
  } catch (err) {
    console.error("[analytics/fetchConversionRate]", err);
    return {
      totalSessions: 0,
      quoteRequestSessions: 0,
      formSubmissionSessions: 0,
      quoteRequestRate: 0,
      formSubmissionRate: 0,
    };
  }
}

/* ─── buildDashboardSummary ─────────────────────────────────────────────── */

/**
 * Returns all key metrics in a single call — ideal for the dashboard overview.
 *
 * Runs all aggregation queries in parallel for maximum efficiency.
 *
 * @param days - Number of days for the summary period. Defaults to 30.
 */
export async function buildDashboardSummary(
  days = 30
): Promise<DashboardSummary> {
  try {
    const startDate = new Date(Date.now() - days * 86_400_000);

    const [
      totalEventsResult,
      totalSessionsResult,
      totalVisitorsResult,
      bounceRateResult,
      dailyStats,
      topPages,
      topEvents,
      geoStats,
      deviceStats,
      referrerStats,
      conversionRate,
    ] = await Promise.all([
      // Total event count
      prisma.serverAnalyticsEvent.count({
        where: { createdAt: { gte: startDate } },
      }),
      // Distinct sessions
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT session_id)::bigint AS count
        FROM server_analytics_events
        WHERE session_id IS NOT NULL AND created_at >= ${startDate}
      `,
      // Distinct visitors
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT visitor_id)::bigint AS count
        FROM server_analytics_events
        WHERE visitor_id IS NOT NULL AND created_at >= ${startDate}
      `,
      // Overall bounce rate
      calculateBounceRate(startDate),
      // Daily breakdown
      fetchDailyStats(days),
      // Top pages
      fetchTopPages(10),
      // Top events
      fetchTopEvents(10, days),
      // Geo stats
      fetchGeoStats(10),
      // Device breakdown
      fetchDeviceStats(),
      // Referrer breakdown
      fetchReferrerStats(10),
      // Conversion rates
      fetchConversionRate(days),
    ]);

    return {
      totalEvents: totalEventsResult,
      totalSessions: Number(totalSessionsResult[0]?.count ?? 0),
      totalVisitors: Number(totalVisitorsResult[0]?.count ?? 0),
      overallBounceRate: bounceRateResult,
      dailyStats,
      topPages,
      topEvents,
      geoStats,
      deviceStats,
      referrerStats,
      conversionRate,
      generatedAt: new Date(),
      periodDays: days,
    };
  } catch (err) {
    console.error("[analytics/buildDashboardSummary]", err);
    return {
      totalEvents: 0,
      totalSessions: 0,
      totalVisitors: 0,
      overallBounceRate: 0,
      dailyStats: [],
      topPages: [],
      topEvents: [],
      geoStats: [],
      deviceStats: [],
      referrerStats: [],
      conversionRate: {
        totalSessions: 0,
        quoteRequestSessions: 0,
        formSubmissionSessions: 0,
        quoteRequestRate: 0,
        formSubmissionRate: 0,
      },
      generatedAt: new Date(),
      periodDays: days,
    };
  }
}

/* ─── Internal helpers ──────────────────────────────────────────────────── */

function extractDomain(url: string): string {
  try {
    // Strip protocol, www., and trailing path for a clean label.
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.length > 40 ? url.slice(0, 37) + "…" : url;
  }
}

async function calculateBounceRate(since: Date): Promise<number> {
  try {
    const rows = await prisma.$queryRaw<Array<{ session_id: string | null; cnt: bigint }>>`
      SELECT
        session_id,
        COUNT(*)::bigint AS cnt
      FROM server_analytics_events
      WHERE session_id IS NOT NULL
        AND created_at >= ${since}
      GROUP BY session_id
      HAVING COUNT(*) = 1
    `;

    const totalResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT session_id)::bigint AS count
      FROM server_analytics_events
      WHERE session_id IS NOT NULL AND created_at >= ${since}
    `;

    const totalSessions = Number(totalResult[0]?.count ?? 0);
    if (totalSessions === 0) return 0;

    return Math.round((rows.length / totalSessions) * 10_000) / 100;
  } catch {
    return 0;
  }
}
