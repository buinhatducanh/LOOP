"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { LoadingSkeleton } from "@/components/admin/ui/loading-skeleton";
import { PageHeader } from "@/components/admin/ui/page-header";

interface Backlog {
  id: string; projectId: string; epicId: string | null; name: string;
  totalLp: number; sortOrder: number;
  _count?: { tasks: number };
  epic?: { title: string; color: string };
  project?: { id: string; orderNumber: string; customerName: string };
}

export default function ProjectBacklogsPage() {
  const router = useRouter();
  const [backlogs, setBacklogs] = useState<Backlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [projectId, setProjectId] = useState("");

  const fetchBacklogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (projectId) params.set("projectId", projectId);
      const res = await fetch(`/api/admin/backlogs?${params}`);
      const json = await res.json();
      setBacklogs(json.data ?? []);
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchBacklogs(); }, [fetchBacklogs]);

  const byProject = backlogs.reduce<Record<string, Backlog[]>>((acc, b) => {
    const key = b.projectId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  const filtered = filter
    ? backlogs.filter(b =>
        b.name.toLowerCase().includes(filter.toLowerCase()) ||
        b.epic?.title.toLowerCase().includes(filter.toLowerCase())
      )
    : backlogs;

  return (
    <div className="p-6">
      <PageHeader
        title="All Backlogs"
        description={`${backlogs.length} items · ${Object.keys(byProject).length} projects`}
        className="mb-6"
      />

      <div className="mb-6">
        <input value={filter} onChange={e => setFilter(e.target.value)}
          placeholder="Search backlogs..."
          className="rounded-lg border px-4 py-2 text-sm text-white w-full max-w-sm"
          style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
      </div>

      {loading ? (
        <LoadingSkeleton type="row" count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState icon="≡" message="Không có backlog nào" description="Tạo backlog mới từ trang dự án." />
      ) : Object.keys(byProject).length > 1 && !filter ? (
        <div className="space-y-6">
          {Object.entries(byProject).map(([pid, items]) => {
            const project = items[0].project;
            return (
              <div key={pid}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <span className="text-xs font-medium px-2" style={{ color: "rgba(139,92,246,0.8)" }}>
                    {project?.orderNumber ?? pid}
                  </span>
                  <span className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
                    {project?.customerName ?? ""}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>
                <div className="space-y-2">
                  {items.map(b => (
                    <div key={b.id}
                      className="rounded-xl border p-4 flex items-center gap-4 cursor-pointer hover:border-white/15 transition-colors"
                      style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}
                      onClick={() => router.push(`/admin/projects/${pid}/board`)}>
                      <div className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: b.epic?.color ?? "#6366F1" }} />
                      <div className="flex-1">
                        <p className="text-sm text-white">{b.name}</p>
                        {b.epic && (
                          <p className="text-[10px] mt-0.5" style={{ color: "rgba(139,92,246,0.6)" }}>
                            Epic: {b.epic.title}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-semibold" style={{ color: "#A78BFA" }}>⬡{b.totalLp}</span>
                        <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                          {b._count?.tasks ?? 0} tasks
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(b => (
            <div key={b.id}
              className="rounded-xl border p-4 flex items-center gap-4"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="w-3 h-3 rounded-full shrink-0"
                style={{ background: b.epic?.color ?? "#6366F1" }} />
              <div className="flex-1">
                <p className="text-sm text-white">{b.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {b.epic && (
                    <span className="text-[10px] rounded px-1.5 py-0.5"
                      style={{ background: `${b.epic.color}20`, color: b.epic.color }}>
                      {b.epic.title}
                    </span>
                  )}
                  <span className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                    {b.project?.orderNumber}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-semibold" style={{ color: "#A78BFA" }}>⬡{b.totalLp}</span>
                <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                  {b._count?.tasks ?? 0} tasks
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
