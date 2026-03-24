"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/admin/ui/empty-state";

const VI_DATE = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
});

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};
const SOURCE_LABELS: Record<string, string> = {
  git_merge: "Git Merge", manual: "Thủ công", task_done: "Task Done",
  commit_merge: "Commit Merge", seo_article: "SEO Blog",
};

interface LpAward {
  id: string;
  projectId: string;
  taskId: string | null;
  memberId: string;
  lpAmount: number;
  expAmount: number;
  source: string;
  status: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
  task?: { id: string; title: string; status: string };
  project?: { id: string; orderNumber: string; customerName: string };
  member?: { id: string; name: string; role: string } | null;
  approver?: { id: string; name: string } | null;
}

export default function StandaloneLpAwardsPage() {
  const [awards, setAwards] = useState<LpAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "pending", search: "" });
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<{ id: string; name: string; lp: number } | null>(null);

  const fetchAwards = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.status !== "all") params.set("status", filter.status);
    if (filter.search) params.set("search", filter.search);
    try {
      const res = await fetch(`/api/admin/lp-awards?${params}`);
      const json = await res.json();
      setAwards(json.data ?? []);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchAwards(); }, [fetchAwards]);

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
      fetchAwards();
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
      fetchAwards();
    } catch {
      toast.error("Lỗi khi từ chối LP");
    } finally { setProcessing(null); }
  };

  const pendingCount = awards.filter(a => a.status === "pending").length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">LP Awards</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            Duyệt LP cho thành viên
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

      <div className="flex items-center gap-3 mb-6">
        <input
          value={filter.search}
          onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
          placeholder="Tìm theo tên..."
          className="rounded-lg border px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500"
          style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", width: 240 }}
        />
        {(["all", "pending", "approved", "rejected"] as const).map(s => (
          <button key={s} onClick={() => setFilter(f => ({ ...f, status: s }))}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-all"
            style={{
              background: filter.status === s ? "rgba(139,92,246,0.2)" : "transparent",
              borderColor: filter.status === s ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.1)",
              color: filter.status === s ? "#fff" : "rgba(209,213,219,0.6)",
            }}>
            {s === "all" ? "Tất cả" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {([
          { label: "Tổng đã duyệt", value: awards.filter(a => a.status === "approved").reduce((s, a) => s + a.lpAmount, 0), color: "#10B981" },
          { label: "Chờ duyệt", value: awards.filter(a => a.status === "pending").reduce((s, a) => s + a.lpAmount, 0), color: "#F59E0B" },
          { label: "Từ chối", value: awards.filter(a => a.status === "rejected").reduce((s, a) => s + a.lpAmount, 0), color: "#EF4444" },
        ] as const).map(stat => (
          <div key={stat.label} className="rounded-xl border p-4 text-center"
            style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
            <p className="text-2xl font-black" style={{ color: stat.color }}>⬡{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <EmptyState icon="⏳" message="Đang tải..." />
      ) : awards.length === 0 ? (
        <EmptyState icon="⬡" message="Không có award nào" description="Các LP awards sẽ xuất hiện ở đây khi có task được duyệt." />
      ) : (
        <div className="space-y-3">
          {awards.map(award => (
            <div key={award.id}
              className="rounded-xl border p-4 flex items-center gap-4"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="text-center shrink-0 w-16">
                <p className="text-xl font-black" style={{ color: "#A78BFA" }}>⬡{award.lpAmount}</p>
                <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.3)" }}>LP</p>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: ["#6366F1","#EC4899","#F59E0B","#10B981","#06B6D4"][Math.abs(award.memberId.charCodeAt(0)) % 5] }}>
                {award.member?.name?.slice(0, 2).toUpperCase() ?? award.memberId.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {award.member && (
                    <span className="text-sm font-semibold text-white">{award.member.name}</span>
                  )}
                  {award.member?.role && (
                    <span className="text-[10px] rounded px-1.5 py-0.5"
                      style={{ background: "rgba(99,102,241,0.15)", color: "#818CF8" }}>
                      {award.member.role}
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${STATUS_COLORS[award.status]}`}>
                    {STATUS_LABELS[award.status]}
                  </span>
                  <span className="text-[10px] rounded px-1.5 py-0.5"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(139,92,246,0.7)" }}>
                    {SOURCE_LABELS[award.source] ?? award.source}
                  </span>
                </div>
                {award.task && (
                  <p className="text-sm text-white truncate">{award.task.title}</p>
                )}
                {award.project && (
                  <p className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
                    {award.project.orderNumber} · {award.project.customerName}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
                  {VI_DATE.format(new Date(award.createdAt))}
                </p>
                {award.approvedAt && (
                  <p className="text-[10px]" style={{ color: "rgba(16,185,129,0.6)" }}>
                    Duyệt: {VI_DATE.format(new Date(award.approvedAt))}
                  </p>
                )}
                {award.rejectedReason && (
                  <p className="text-[10px] text-red-400 mt-0.5 max-w-[200px] truncate" title={award.rejectedReason}>
                    {award.rejectedReason}
                  </p>
                )}
              </div>
              {award.status === "pending" && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => approve(award.id)}
                    disabled={processing === award.id}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: "#10B981" }}>
                    ✓ Duyệt
                  </button>
                  <button
                    onClick={() => setRejecting({ id: award.id, name: award.member?.name ?? award.memberId, lp: award.lpAmount })}
                    disabled={processing === award.id}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                    style={{ borderColor: "rgba(239,68,68,0.3)" }}>
                    ✕ Từ chối
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {rejecting && (
        <RejectDialog
          memberName={rejecting.name}
          lpAmount={rejecting.lp}
          onConfirm={async (reason) => { setRejecting(null); await reject(rejecting.id, reason); }}
          onCancel={() => setRejecting(null)}
        />
      )}
    </div>
  );
}

function RejectDialog({ memberName, lpAmount, onConfirm, onCancel }: {
  memberName: string; lpAmount: number;
  onConfirm: (reason: string) => void; onCancel: () => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-sm rounded-2xl border p-6"
        style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}>
        <h2 className="text-lg font-bold text-white mb-1">Từ chối LP Award</h2>
        <p className="text-sm mb-4" style={{ color: "rgba(209,213,219,0.5)" }}>
          Từ chối <span style={{ color: "#A78BFA" }}>⬡{lpAmount}</span> LP cho <strong>{memberName}</strong>
        </p>
        <div className="space-y-3">
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Lý do từ chối (VD: Task chưa đạt yêu cầu)..."
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-red-500"
          />
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(209,213,219,0.7)" }}>
              Hủy
            </button>
            <button onClick={() => reason.trim() && onConfirm(reason.trim())}
              disabled={!reason.trim()}
              className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: "#EF4444" }}>
              Từ chối
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
