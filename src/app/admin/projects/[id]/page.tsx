"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props { params: Promise<{ id: string }>; }

interface ProjectStats {
  totalTasks: number; doneTasks: number; inProgressTasks: number;
  violatedTasks: number; totalLpAwarded: number; totalLpPending: number;
  memberCount: number;
}
interface ProjectInfo {
  id: string; orderNumber: string; customerName: string;
  companyName: string | null; area: string | null;
  projectStatus: string | null; startedAt: string | null;
  _count?: { projectMembers: number };
}

const VI_DATE = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const VI_SHORT = new Intl.DateTimeFormat("vi-VN", { month: "short", year: "numeric" });

const STAT_TILES = [
  { key: "totalTasks", label: "Tasks", color: "#6366F1", bg: "rgba(99,102,241,0.12)" },
  { key: "doneTasks", label: "Hoàn thành", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  { key: "inProgressTasks", label: "Đang làm", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  { key: "violatedTasks", label: "Vi phạm SLA", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  { key: "totalLpAwarded", label: "LP đã duyệt", color: "#A78BFA", bg: "rgba(139,92,246,0.12)" },
  { key: "totalLpPending", label: "LP chờ duyệt", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
];

const NAV_TILES = [
  {
    key: "board", label: "Kanban Board", icon: "◫",
    href: (id: string) => `/admin/projects/${id}/board`,
    desc: "Backlogs, tasks, SLA tracking",
    color: "#6366F1",
  },
  {
    key: "team", label: "Team LP", icon: "👥",
    href: (id: string) => `/admin/projects/${id}/team`,
    desc: "Leaderboard & thành viên",
    color: "#8B5CF6",
  },
  {
    key: "backlogs", label: "Backlogs", icon: "≡",
    href: (id: string) => `/admin/projects/${id}/backlogs`,
    desc: "Epics & backlog items",
    color: "#0EA5E9",
  },
  {
    key: "commits", label: "Git Commits", icon: "⎇",
    href: (id: string) => `/admin/projects/${id}/commits`,
    desc: "Commit history & LP awards",
    color: "#10B981",
  },
  {
    key: "lp", label: "LP Awards", icon: "⬡",
    href: (id: string) => `/admin/projects/${id}/lp`,
    desc: "Quản lý LP & EXP",
    color: "#A78BFA",
  },
  {
    key: "standups", label: "Daily Standups", icon: "☀",
    href: (id: string) => `/admin/projects/${id}/standups`,
    desc: "Báo cáo hàng ngày",
    color: "#F59E0B",
  },
  {
    key: "qa", label: "QA / Bug Notes", icon: "🐛",
    href: (id: string) => `/admin/projects/${id}/qa`,
    desc: "Bug tracker & severity",
    color: "#EF4444",
  },
  {
    key: "env", label: "Env Files", icon: "🔐",
    href: (id: string) => `/admin/projects/${id}/env`,
    desc: "Biến môi trường & credentials",
    color: "#06B6D4",
  },
  {
    key: "deployments", label: "Deployments", icon: "🚀",
    href: (id: string) => `/admin/projects/${id}/deployments`,
    desc: "CI/CD & release history",
    color: "#14B8A6",
  },
  {
    key: "social", label: "Social Posts", icon: "📘",
    href: (id: string) => `/admin/projects/${id}/social`,
    desc: "Content calendar & scheduling",
    color: "#EC4899",
  },
  {
    key: "blog", label: "Blog Posts", icon: "📝",
    href: (id: string) => `/admin/projects/${id}/blog`,
    desc: "SEO articles & LP rewards",
    color: "#84CC16",
  },
  {
    key: "handover", label: "Handover", icon: "📦",
    href: (id: string) => `/admin/projects/${id}/handover`,
    desc: "Checklist bàn giao",
    color: "#F97316",
  },
];

export default function ProjectOverviewPage({ params: paramsPromise }: Props) {
  const router = useRouter();
  const [projectId, setProjectId] = useState("");
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [portalTokens, setPortalTokens] = useState<Array<{ id: string; token: string; label: string; isActive: boolean; expiresAt: string | null; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState(false);

  useEffect(() => { paramsPromise.then(p => setProjectId(p.id)); }, [paramsPromise]);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [projRes, lpRes, portalRes] = await Promise.all([
        fetch(`/api/admin/orders/${projectId}`).then(r => r.json()),
        fetch(`/api/admin/lp-summary/${projectId}`).then(r => r.json()),
        fetch(`/api/admin/portal?projectId=${projectId}`).then(r => r.json()).catch(() => ({ data: [] })),
      ]);
      setProject(projRes.data ?? null);
      setPortalTokens(portalRes.data ?? []);

      const lpData = lpRes.data;
      const taskStats = lpData?.taskStats ?? {};
      setStats({
        totalTasks: taskStats.total ?? 0,
        doneTasks: taskStats.done ?? 0,
        inProgressTasks: taskStats.inProgress ?? 0,
        violatedTasks: taskStats.violated ?? 0,
        totalLpAwarded: lpData?.totalLpAwarded ?? 0,
        totalLpPending: lpData?.totalLpPending ?? 0,
        memberCount: lpData?.members?.length ?? 0,
      });
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const generatePortalLink = async () => {
    if (!projectId) return;
    setGenLoading(true);
    try {
      const res = await fetch("/api/admin/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, label: "Client Portal", expiresInDays: 365 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const url = json.data.portalUrl;
      await navigator.clipboard.writeText(url);
      toast.success("Portal link đã được tạo và copy vào clipboard!");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    } finally { setGenLoading(false); }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/portal/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link đã copy!");
  };

  if (loading || !project || !stats) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-24 rounded-xl bg-white/5" />
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-white/5" />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.doneTasks / stats.totalTasks) * 100) : 0;

  const statValues = {
    totalTasks: stats.totalTasks,
    doneTasks: stats.doneTasks,
    inProgressTasks: stats.inProgressTasks,
    violatedTasks: stats.violatedTasks,
    totalLpAwarded: stats.totalLpAwarded,
    totalLpPending: stats.totalLpPending,
  };

  const areaLabels: Record<string, string> = {
    can_tho: "Cần Thơ", an_giang: "An Giang", kien_giang: "Kiên Giang",
    dong_thap: "Đồng Tháp", long_an: "Long An", tien_giang: "Tiền Giang",
    vinh_long: "Vĩnh Long", ben_tre: "Bến Tre", tra_vinh: "Trà Vinh",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Project header */}
      <div
        className="rounded-xl border p-5"
        style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-white">{project.customerName}</h1>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ background: "rgba(99,102,241,0.15)", color: "#818CF8" }}
              >
                {project.orderNumber}
              </span>
              {project.projectStatus && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    background: project.projectStatus === "active" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                    color: project.projectStatus === "active" ? "#10B981" : "#F59E0B",
                  }}
                >
                  {project.projectStatus}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
              {project.companyName && <span>{project.companyName}</span>}
              {project.area && <span>{areaLabels[project.area] ?? project.area}</span>}
              {project.startedAt && (
                <span>Started {VI_DATE.format(new Date(project.startedAt))}</span>
              )}
            </div>
          </div>

          {/* Mini task progress */}
          <div className="text-right shrink-0">
            <p className="text-xs mb-1" style={{ color: "rgba(209,213,219,0.4)" }}>
              Task completion
            </p>
            <p className="text-2xl font-black" style={{ color: completionRate >= 70 ? "#10B981" : completionRate >= 40 ? "#F59E0B" : "#EF4444" }}>
              {completionRate}%
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${completionRate}%`,
              background: completionRate >= 70 ? "#10B981" : completionRate >= 40 ? "#F59E0B" : "#EF4444",
            }}
          />
        </div>
      </div>

      {/* Client Portal Links */}
      <div className="rounded-xl border p-5"
        style={{ background: "rgba(139,92,246,0.04)", borderColor: "rgba(139,92,246,0.15)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              🔗 Client Portal
            </h2>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(209,213,219,0.4)" }}>
              Chia sẻ tiến độ dự án với khách hàng — không cần đăng nhập
            </p>
          </div>
          <button
            onClick={generatePortalLink}
            disabled={genLoading}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40 transition-all"
            style={{ background: "#8B5CF6" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#7C3AED")}
            onMouseLeave={e => (e.currentTarget.style.background = "#8B5CF6")}>
            {genLoading ? "Đang tạo…" : "+ Tạo Portal Link"}
          </button>
        </div>

        {portalTokens.length === 0 ? (
          <p className="text-xs py-3" style={{ color: "rgba(209,213,219,0.3)" }}>
            Chưa có portal link nào. Click "Tạo Portal Link" để tạo.
          </p>
        ) : (
          <div className="space-y-2">
            {portalTokens.slice(0, 5).map(token => (
              <div key={token.id}
                className="flex items-center gap-3 rounded-lg border p-3 text-xs"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{token.label}</p>
                  <p className="font-mono text-[10px] truncate mt-0.5"
                    style={{ color: "rgba(139,92,246,0.7)" }}>
                    /portal/{token.token}
                  </p>
                  {token.expiresAt && (
                    <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.3)" }}>
                      Hết hạn: {VI_DATE.format(new Date(token.expiresAt))}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background: token.isActive ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.12)",
                      color: token.isActive ? "#10B981" : "#94A3B8",
                    }}>
                    {token.isActive ? "Active" : "Disabled"}
                  </span>
                  <button
                    onClick={() => copyLink(token.token)}
                    className="rounded border px-2 py-1 transition-all"
                    style={{ borderColor: "rgba(139,92,246,0.3)", color: "#A78BFA" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(139,92,246,0.6)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(139,92,246,0.3)")}>
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAT_TILES.map(tile => (
          <div key={tile.key}
            className="rounded-xl border p-4 text-center"
            style={{ background: tile.bg, borderColor: `${tile.color}30` }}>
            <p className="text-2xl font-black" style={{ color: tile.color }}>
              {tile.key.includes("Lp") ? `⬡${statValues[tile.key as keyof typeof statValues]}` : statValues[tile.key as keyof typeof statValues]}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(209,213,219,0.5)" }}>{tile.label}</p>
          </div>
        ))}
      </div>

      {/* Member count */}
      <div className="flex items-center gap-3">
        <span className="text-sm" style={{ color: "rgba(209,213,219,0.4)" }}>Team:</span>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(stats.memberCount, 5) }).map((_, i) => (
            <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white -ml-1 first:ml-0"
              style={{ background: ["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#06B6D4"][i % 5], border: "2px solid #09090f" }}>
              {String.fromCharCode(65 + i)}
            </div>
          ))}
          {stats.memberCount > 5 && (
            <span className="text-[10px] text-white/40 ml-1">+{stats.memberCount - 5}</span>
          )}
        </div>
        <span className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>{stats.memberCount} member{stats.memberCount !== 1 ? "s" : ""}</span>
      </div>

      {/* Navigation tiles */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "rgba(209,213,219,0.5)" }}>
          Project Sections
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {NAV_TILES.map(tile => (
            <Link key={tile.key} href={tile.href(projectId)}
              className="group rounded-xl border p-4 flex flex-col gap-2 transition-all hover:scale-[1.02]"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderColor: "rgba(255,255,255,0.08)",
              }}>
              <div className="flex items-center justify-between">
                <span className="text-xl" style={{ filter: `drop-shadow(0 0 4px ${tile.color})` }}>
                  {tile.icon}
                </span>
                <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: tile.color }}>→</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{tile.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(209,213,219,0.4)" }}>{tile.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => router.push(`/admin/projects/${projectId}/board`)}
          className="rounded-lg px-4 py-2 text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: "#6366F1" }}>
          ◫ Mở Kanban Board
        </button>
        <button
          onClick={() => router.push(`/admin/projects`)}
          className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
          style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(209,213,219,0.6)" }}>
          ← Tất cả dự án
        </button>
      </div>
    </div>
  );
}
