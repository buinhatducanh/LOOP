"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/ui/page-header";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { LoadingSkeleton } from "@/components/admin/ui/loading-skeleton";

interface Project {
  id: string; orderNumber: string; customerName: string; customerEmail: string;
  projectStatus: string; isActiveProject: boolean;
  createdAt: string;
  _count?: { projectMembers: number };
}

const STATUS_COLORS: Record<string, string> = {
  active: "#10B981", paused: "#F59E0B", completed: "#6366F1", cancelled: "#EF4444",
};
const VI_DATE = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      const json = await res.json();
      const orders = (json.data ?? []).filter((o: Project) => o.isActiveProject);
      setProjects(orders);
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const filtered = projects.filter(p =>
    filter === "" ||
    p.orderNumber.toLowerCase().includes(filter.toLowerCase()) ||
    p.customerName.toLowerCase().includes(filter.toLowerCase()) ||
    p.customerEmail.toLowerCase().includes(filter.toLowerCase())
  );

  const openCount = projects.filter(p => p.projectStatus === "active").length;

  return (
    <div className="p-6">
      <PageHeader
        title="All Projects"
        description={`${openCount} active · ${projects.length} total`}
        count={projects.length}
        className="mb-6"
        action={
          <div className="flex items-center gap-2 rounded-xl px-4 py-2"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <span className="text-lg font-black" style={{ color: "#10B981" }}>{openCount}</span>
            <span className="text-sm" style={{ color: "rgba(16,185,129,0.7)" }}>active</span>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <input value={filter} onChange={e => setFilter(e.target.value)}
          placeholder="Search by name, order number, email..."
          className="flex-1 rounded-lg border px-4 py-2 text-sm text-white"
          style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
        {(["all", "active", "paused", "completed"] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="rounded-lg border px-3 py-2 text-xs font-medium transition-all capitalize"
            style={{
              background: statusFilter === s ? (s === "active" ? "rgba(16,185,129,0.15)" : s === "paused" ? "rgba(245,158,11,0.15)" : s === "completed" ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)") : "transparent",
              borderColor: statusFilter === s ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.1)",
              color: statusFilter === s ? "#fff" : "rgba(209,213,219,0.5)",
            }}>
            {s}
          </button>
        ))}
      </div>

      {/* Project cards */}
      {loading ? (
        <LoadingSkeleton type="card" count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="📁" message="Không có dự án nào" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(project => {
            const color = STATUS_COLORS[project.projectStatus] ?? "#64748b";
            return (
              <div key={project.id}
                className="rounded-xl border p-5 cursor-pointer transition-all hover:border-white/15"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}
                onClick={() => router.push(`/admin/projects/${project.id}/board`)}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-mono mb-1" style={{ color: "rgba(139,92,246,0.8)" }}>
                      {project.orderNumber}
                    </p>
                    <h3 className="text-sm font-semibold text-white leading-tight">
                      {project.customerName}
                    </h3>
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(209,213,219,0.4)" }}>
                      {project.customerEmail}
                    </p>
                  </div>
                  <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ background: color }} />
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] rounded-full px-2 py-0.5 capitalize font-medium border"
                    style={{
                      background: `${color}15`,
                      borderColor: `${color}40`,
                      color: color,
                    }}>
                    {project.projectStatus}
                  </span>
                  {project._count && (
                    <span className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                      👥 {project._count.projectMembers}
                    </span>
                  )}
                </div>

                {/* Quick links */}
                <div className="grid grid-cols-4 gap-1">
                  {([
                    { label: "Board", icon: "◫", path: `/admin/projects/${project.id}/board` },
                    { label: "Team", icon: "👥", path: `/admin/projects/${project.id}/team` },
                    { label: "Backlogs", icon: "≡", path: `/admin/projects/${project.id}/backlogs` },
                    { label: "QA", icon: "🐛", path: `/admin/projects/${project.id}/qa` },
                  ] as const).map(link => (
                    <button key={link.label}
                      onClick={e => { e.stopPropagation(); router.push(link.path); }}
                      className="rounded-lg border py-2 text-center transition-all hover:bg-white/5 text-[10px]"
                      style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      <span>{link.icon}</span>
                      <p className="mt-0.5" style={{ color: "rgba(209,213,219,0.5)" }}>{link.label}</p>
                    </button>
                  ))}
                </div>

                {/* Date */}
                <p className="text-[10px] mt-3 text-right" style={{ color: "rgba(209,213,219,0.25)" }}>
                  {VI_DATE.format(new Date(project.createdAt))}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
