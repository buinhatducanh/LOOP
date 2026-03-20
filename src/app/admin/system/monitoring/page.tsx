/**
 * System Monitoring Dashboard
 *
 * Shows real-time health of all infrastructure components:
 * - Database (Neon PostgreSQL)
 * - Sanity CMS
 * - Redis (Upstash)
 *
 * Accessible only to admin/system-level roles (level ≤ 1).
 */

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { client } from "@/sanity/client";
import { redis } from "@/lib/redis";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HealthStatus {
  service: string;
  status: "healthy" | "degraded" | "down";
  latency?: number;
  message?: string;
  lastCheck: string;
}

// ─── Health Checks ─────────────────────────────────────────────────────────────

async function checkDatabase(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      service: "PostgreSQL (Neon)",
      status: "healthy",
      latency: Date.now() - start,
      lastCheck: new Date().toISOString(),
    };
  } catch (err) {
    return {
      service: "PostgreSQL (Neon)",
      status: "down",
      latency: Date.now() - start,
      message: err instanceof Error ? err.message : "Connection failed",
      lastCheck: new Date().toISOString(),
    };
  }
}

async function checkSanity(): Promise<HealthStatus> {
  const start = Date.now();
  try {
    await client.fetch<unknown>(`*[_type == "siteConfig"][0]{_id}`);
    return {
      service: "Sanity CMS",
      status: "healthy",
      latency: Date.now() - start,
      lastCheck: new Date().toISOString(),
    };
  } catch (err) {
    return {
      service: "Sanity CMS",
      status: "degraded",
      latency: Date.now() - start,
      message: err instanceof Error ? err.message : "Connection failed",
      lastCheck: new Date().toISOString(),
    };
  }
}

async function checkRedis(): Promise<HealthStatus> {
  if (!redis) {
    return {
      service: "Redis (Upstash)",
      status: "degraded",
      message: "Not configured — using in-memory fallback",
      lastCheck: new Date().toISOString(),
    };
  }
  const start = Date.now();
  try {
    const pong = await redis.ping();
    return {
      service: "Redis (Upstash)",
      status: pong === "PONG" ? "healthy" : "degraded",
      latency: Date.now() - start,
      message: typeof pong === "string" ? pong : undefined,
      lastCheck: new Date().toISOString(),
    };
  } catch (err) {
    return {
      service: "Redis (Upstash)",
      status: "down",
      latency: Date.now() - start,
      message: err instanceof Error ? err.message : "Ping failed",
      lastCheck: new Date().toISOString(),
    };
  }
}

async function getUptime(): Promise<string> {
  try {
    const first = await prisma.auditLog.findFirst({
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    if (!first) return "< 1h";
    const diff = Date.now() - first.createdAt.getTime();
    const totalMinutes = Math.floor(diff / 60000);
    if (totalMinutes < 60) return `${totalMinutes}m`;
    const h = Math.floor(totalMinutes / 60);
    if (h < 24) return `${h}h ${totalMinutes % 60}m`;
    return `${Math.floor(h / 24)}d ${h % 24}h`;
  } catch {
    return "Unknown";
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: HealthStatus["status"] }) {
  const colors = {
    healthy: "bg-green-400",
    degraded: "bg-yellow-400",
    down: "bg-red-400",
  };
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${colors[status]} animate-pulse`}
    />
  );
}

function Latency({ ms }: { ms: number }) {
  if (ms < 100) return <span className="text-green-400">{ms}ms</span>;
  if (ms < 500) return <span className="text-yellow-400">{ms}ms</span>;
  return <span className="text-red-400">{ms}ms</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "System Monitoring",
  description: "Real-time health monitoring for LOOP infrastructure",
  robots: { index: false, follow: false },
};

export default async function MonitoringPage() {
  const [db, sanity, cache, uptime] = await Promise.all([
    checkDatabase(),
    checkSanity(),
    checkRedis(),
    getUptime(),
  ]);

  const statuses: HealthStatus[] = [db, sanity, cache];
  const overallOk = statuses.every((s) => s.status !== "down");

  // Key counts
  let counts = { services: 0, projects: 0, testimonials: 0, messages: 0 };
  try {
    const [s, p, t, m] = await Promise.all([
      prisma.service.count({ where: { isActive: true } }),
      prisma.project.count({ where: { isPublished: true } }),
      prisma.testimonial.count({ where: { isActive: true } }),
      prisma.contactMessage.count(),
    ]);
    counts = { services: s, projects: p, testimonials: t, messages: m };
  } catch {
    // DB may be down
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Monitoring</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time infrastructure health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusDot status={overallOk ? "healthy" : "degraded"} />
          <span className="text-sm text-slate-300">
            {overallOk ? "All systems operational" : "Some systems degraded"}
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Active Services", value: counts.services },
          { label: "Projects", value: counts.projects },
          { label: "Testimonials", value: counts.testimonials },
          { label: "Messages", value: counts.messages },
          { label: "Uptime", value: uptime },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg border border-slate-800 bg-slate-900 p-4"
          >
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Infrastructure Table */}
      <div className="rounded-lg border border-slate-800 overflow-hidden">
        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">Infrastructure</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-left">
              <th className="px-4 py-3 text-slate-400 font-medium">Service</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Status</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Latency</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Details</th>
              <th className="px-4 py-3 text-slate-400 font-medium">Last Check</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((s) => (
              <tr key={s.service} className="border-b border-slate-800 last:border-0">
                <td className="px-4 py-3 text-white font-medium">{s.service}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5">
                    <StatusDot status={s.status} />
                    <span
                      className={
                        s.status === "healthy"
                          ? "text-green-400"
                          : s.status === "degraded"
                          ? "text-yellow-400"
                          : "text-red-400"
                      }
                    >
                      {s.status === "healthy"
                        ? "Healthy"
                        : s.status === "degraded"
                        ? "Degraded"
                        : "Down"}
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">
                  {s.latency !== undefined ? <Latency ms={s.latency} /> : "—"}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">
                  {s.message ?? "—"}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {new Date(s.lastCheck).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* External Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Neon Dashboard", sub: "PostgreSQL", href: "https://neon.tech" },
          { label: "Upstash Console", sub: "Redis", href: "https://console.upstash.com" },
          { label: "Sentry", sub: "Error Tracking", href: "https://sentry.io" },
          { label: "Vercel", sub: "Deployment", href: "https://vercel.com" },
        ].map(({ label, sub, href }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-800 p-4 hover:border-indigo-500 transition-colors block"
          >
            <div className="text-sm font-medium text-white">{label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
