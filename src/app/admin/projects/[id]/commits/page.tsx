"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectHeader } from "@/components/admin/shared/project-header";

interface Props { params: Promise<{ id: string }>; }

interface GitCommit {
  id: string;
  sha: string;
  message: string;
  authorName: string;
  authorEmail: string;
  branch: string;
  eventType: string;
  mergedToMain: boolean;
  lpAwarded: boolean;
  expAwarded: boolean;
  committedAt: string;
  receivedAt: string;
  task?: { id: string; title: string } | null;
}

const VI_DATE = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
});

export default function ProjectCommitsPage({ params: paramsPromise }: Props) {
  const [projectId, setProjectId] = useState("");
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "push" | "merge">("all");

  useEffect(() => { paramsPromise.then(p => setProjectId(p.id)); }, [paramsPromise]);

  const fetchCommits = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/git-commits?projectId=${projectId}`);
      const json = await res.json();
      setCommits(json.data ?? []);
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchCommits(); }, [fetchCommits]);

  const filtered = filter === "all" ? commits :
    commits.filter(c => filter === "merge" ? c.eventType === "merge" : c.eventType === "push");

  const mergeCount = commits.filter(c => c.mergedToMain).length;
  const lpAwardedCount = commits.filter(c => c.lpAwarded).length;

  return (
    <div className="p-6">
      <ProjectHeader projectId={projectId} className="mb-6" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Git Commits</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            {commits.length} commits · {mergeCount} merged to main · {lpAwardedCount} LP awarded
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span>Webhook active — /api/webhooks/github/{projectId?.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {([
          { label: "Tổng commits", value: commits.length, color: "#94a3b8" },
          { label: "Push", value: commits.filter(c => c.eventType === "push").length, color: "#6366F1" },
          { label: "Merges", value: commits.filter(c => c.eventType === "merge").length, color: "#10B981" },
          { label: "LP Awards", value: lpAwardedCount, color: "#A78BFA" },
        ] as const).map(s => (
          <div key={s.label} className="rounded-xl border p-3 text-center"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(209,213,219,0.4)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-6">
        {(["all", "push", "merge"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="rounded-lg border px-4 py-2 text-xs font-medium transition-all"
            style={{
              background: filter === f ? "rgba(139,92,246,0.2)" : "transparent",
              borderColor: filter === f ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.1)",
              color: filter === f ? "#fff" : "rgba(209,213,219,0.6)",
            }}>
            {f === "all" ? "Tất cả" : f === "push" ? "Push" : "Merge"}
          </button>
        ))}
      </div>

      {/* Commit list */}
      {loading ? (
        <p className="text-center py-20" style={{ color: "rgba(209,213,219,0.3)" }}>Đang tải...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-xl border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-4xl mb-3">🔀</p>
          <p className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Không có commit nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(commit => (
            <div key={commit.id}
              className="rounded-xl border p-4 flex items-start gap-4"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
              {/* Type indicator */}
              <div className="shrink-0 mt-0.5">
                {commit.mergedToMain ? (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(16,185,129,0.15)" }}>
                    <span className="text-sm" style={{ color: "#10B981" }}>✓</span>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(99,102,241,0.15)" }}>
                    <span className="text-sm" style={{ color: "#6366F1" }}>↑</span>
                  </div>
                )}
              </div>

              {/* Commit info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <code className="text-xs font-mono rounded px-1.5 py-0.5"
                    style={{ background: "rgba(255,255,255,0.06)", color: "#A78BFA" }}>
                    {commit.sha.slice(0, 7)}
                  </code>
                  {commit.mergedToMain && (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>
                      merged to main
                    </span>
                  )}
                  {commit.lpAwarded && (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: "rgba(167,139,250,0.15)", color: "#A78BFA" }}>
                      ⬡ LP awarded
                    </span>
                  )}
                </div>
                <p className="text-sm text-white mb-1 leading-snug">{commit.message}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                    {commit.authorName}
                  </span>
                  <span className="text-[10px] rounded px-1.5 py-0.5"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(139,92,246,0.6)" }}>
                    {commit.branch}
                  </span>
                  {commit.task && (
                    <span className="text-[10px] rounded px-1.5 py-0.5"
                      style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
                      task linked
                    </span>
                  )}
                </div>
              </div>

              {/* Date */}
              <div className="text-right shrink-0">
                <p className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
                  {VI_DATE.format(new Date(commit.committedAt))}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(209,213,219,0.2)" }}>
                  received {VI_DATE.format(new Date(commit.receivedAt))}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
