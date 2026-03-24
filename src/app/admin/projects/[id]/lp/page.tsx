"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectHeader } from "@/components/admin/shared/project-header";
import { toast } from "sonner";

interface Props { params: Promise<{ id: string }>; }

interface Member {
  id: string;
  name: string;
  role: string;
  assignedLp: number;
  earnedLp: number;
  exp: number;
  joinedAt: string;
}

interface LpAward {
  id: string;
  lpAmount: number;
  expAmount: number;
  source: string;
  status: string;
  createdAt: string;
  approvedAt: string | null;
  rejectedReason: string | null;
  task?: { id: string; title: string } | null;
  member?: { id: string; name: string } | null;
}

const VI_DATE = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
});
const STATUS_LABELS: Record<string, string> = { pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối" };
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};
const SOURCE_LABELS: Record<string, string> = {
  git_merge: "Git Merge", commit_merge: "Commit Merge",
  manual: "Thủ công", task_done: "Task Done", seo_article: "SEO Blog",
};

export default function ProjectLpPage({ params: paramsPromise }: Props) {
  const [projectId, setProjectId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [awards, setAwards] = useState<LpAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => { paramsPromise.then(p => setProjectId(p.id)); }, [paramsPromise]);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [mRes, aRes] = await Promise.all([
        fetch(`/api/admin/lp-summary/${projectId}`).then(r => r.json()),
        fetch(`/api/admin/lp-awards?projectId=${projectId}`).then(r => r.json()),
      ]);
      setMembers(mRes.data ?? []);
      setAwards(aRes.data ?? []);
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const approve = async (id: string) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/lp-awards/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Đã duyệt LP");
      fetchData();
    } catch {
      toast.error("Lỗi khi duyệt LP");
    } finally { setProcessing(null); }
  };

  const reject = async (id: string, reason: string) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/admin/lp-awards/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason }),
      });
      if (!res.ok) throw new Error();
      toast.success("Đã từ chối LP");
      fetchData();
    } catch {
      toast.error("Lỗi khi từ chối LP");
    } finally { setProcessing(null); }
  };

  const filtered = filter === "all" ? awards : awards.filter(a => a.status === filter);
  const pendingCount = awards.filter(a => a.status === "pending").length;
  const totalEarned = members.reduce((s, m) => s + m.earnedLp, 0);
  const totalAssigned = members.reduce((s, m) => s + m.assignedLp, 0);

  return (
    <div className="p-6">
      <ProjectHeader projectId={projectId} className="mb-6" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">LP Awards</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            Quản lý LP & EXP của thành viên dự án
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-2"
            style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
            <span className="text-xl font-black text-yellow-400">{pendingCount}</span>
            <span className="text-sm font-medium text-yellow-300">chờ duyệt</span>
          </div>
        )}
      </div>

      {/* Member LP cards */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "rgba(209,213,219,0.5)" }}>
          Thành viên — {totalEarned}/{totalAssigned} LP đã kiếm
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {members.map(m => {
            const pct = m.assignedLp > 0 ? Math.round((m.earnedLp / m.assignedLp) * 100) : 0;
            return (
              <div key={m.id}
                className="rounded-xl border p-4"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: ["#6366F1","#EC4899","#F59E0B","#10B981","#06B6D4"][Math.abs(m.id.charCodeAt(0)) % 5] }}>
                    {m.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                    <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>{m.role}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "rgba(209,213,219,0.5)" }}>LP kiếm được</span>
                    <span style={{ color: "#A78BFA" }}>⬡{m.earnedLp} / ⬡{m.assignedLp}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: "linear-gradient(90deg, #8B5CF6, #A78BFA)" }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "rgba(209,213,219,0.5)" }}>EXP</span>
                    <span style={{ color: "#10B981" }}>✦{m.exp}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {members.length === 0 && (
            <div className="col-span-full text-center py-8" style={{ color: "rgba(209,213,219,0.3)" }}>
              Chưa có thành viên nào trong dự án
            </div>
          )}
        </div>
      </div>

      {/* Awards log */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "rgba(209,213,219,0.5)" }}>
          Lịch sử LP Awards
        </h2>
        <div className="flex items-center gap-3 mb-4">
          {(["all", "pending", "approved", "rejected"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: filter === s ? "rgba(139,92,246,0.2)" : "transparent",
                borderColor: filter === s ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.1)",
                color: filter === s ? "#fff" : "rgba(209,213,219,0.6)",
              }}>
              {s === "all" ? "Tất cả" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center py-12" style={{ color: "rgba(209,213,219,0.3)" }}>Đang tải...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 rounded-xl border"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-3xl mb-2">⬡</p>
            <p className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Không có award nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(award => (
              <div key={award.id}
                className="rounded-xl border p-3 flex items-center gap-3"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="text-center shrink-0 w-12">
                  <p className="text-lg font-black" style={{ color: "#A78BFA" }}>⬡{award.lpAmount}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    {award.member && (
                      <span className="text-xs font-semibold text-white">{award.member.name}</span>
                    )}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium border ${STATUS_COLORS[award.status]}`}>
                      {STATUS_LABELS[award.status]}
                    </span>
                    <span className="text-[10px] rounded px-1.5 py-0.5"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(139,92,246,0.7)" }}>
                      {SOURCE_LABELS[award.source] ?? award.source}
                    </span>
                  </div>
                  {award.task && (
                    <p className="text-xs truncate" style={{ color: "rgba(209,213,219,0.5)" }}>
                      {award.task.title}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.3)" }}>
                    {VI_DATE.format(new Date(award.createdAt))}
                  </p>
                </div>
                {award.status === "pending" && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => approve(award.id)}
                      disabled={processing === award.id}
                      className="rounded px-2 py-1 text-[10px] font-bold text-white disabled:opacity-40"
                      style={{ background: "#10B981" }}>
                      ✓
                    </button>
                    <button onClick={() => {
                      const reason = prompt("Lý do từ chối:");
                      if (reason) reject(award.id, reason);
                    }}
                      disabled={processing === award.id}
                      className="rounded px-2 py-1 text-[10px] font-medium text-red-400 disabled:opacity-40"
                      style={{ border: "1px solid rgba(239,68,68,0.3)" }}>
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
