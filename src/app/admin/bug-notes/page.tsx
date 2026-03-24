"use client";

import { useState, useEffect, useCallback } from "react";

interface BugNote {
  id: string; taskId: string; authorId: string;
  severity: string; content: string;
  status: string; resolvedAt: string | null;
  createdAt: string;
  task?: { id: string; title: string; status: string };
  author?: { id: string; name: string };
}

const SEVERITY_COLORS: Record<string, string> = {
  low: "#3B82F6", medium: "#F59E0B", high: "#F97316", critical: "#EF4444",
};
const VI_DATE = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", hour: "2-digit",
});

export default function BugNotesPage() {
  const [bugs, setBugs] = useState<BugNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState<"all" | "open" | "resolved">("open");

  const fetchBugs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bug-notes");
      const json = await res.json();
      let data: BugNote[] = json.data ?? [];
      if (severity) data = data.filter((b: BugNote) => b.severity === severity);
      if (status === "open") data = data.filter((b: BugNote) => b.status === "open");
      else if (status === "resolved") data = data.filter((b: BugNote) => b.status === "resolved");
      setBugs(data);
    } finally { setLoading(false); }
  }, [severity, status]);

  useEffect(() => { fetchBugs(); }, [fetchBugs]);

  const resolve = async (id: string) => {
    await fetch(`/api/admin/bug-notes/${id}/resolve`, { method: "POST" });
    fetchBugs();
  };

  const open = bugs.filter(b => b.status === "open").length;
  const resolved = bugs.filter(b => b.status === "resolved").length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Bug Tracker</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            Toàn hệ thống · {open} mở · {resolved} đã fix
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(["all", "open", "resolved"] as const).map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-all capitalize"
            style={{
              background: status === s ? "rgba(99,102,241,0.15)" : "transparent",
              borderColor: status === s ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.1)",
              color: status === s ? "#fff" : "rgba(209,213,219,0.5)",
            }}>
            {s}
          </button>
        ))}
        <div className="ml-auto flex gap-1">
          {(["", "low", "medium", "high", "critical"] as const).map(s => (
            <button key={s} onClick={() => setSeverity(s)}
              className="rounded-lg border px-2 py-1 text-[10px] font-medium transition-all"
              style={{
                background: severity === s ? (s ? `${SEVERITY_COLORS[s]}20` : "rgba(99,102,241,0.15)") : "transparent",
                borderColor: severity === s ? (s ? `${SEVERITY_COLORS[s]}40` : "rgba(99,102,241,0.4)") : "rgba(255,255,255,0.1)",
                color: severity === s ? (s ? SEVERITY_COLORS[s] : "#fff") : "rgba(209,213,219,0.5)",
              }}>
              {s === "" ? "All severity" : s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center py-20" style={{ color: "rgba(209,213,219,0.3)" }}>Đang tải...</p>
      ) : bugs.length === 0 ? (
        <div className="text-center py-20 rounded-xl border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-4xl mb-3">🐛</p>
          <p className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Không có bug nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {bugs.map(bug => {
            const isResolved = bug.status === "resolved";
            return (
              <div key={bug.id}
                className="rounded-xl border p-4 flex items-center gap-4"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
                <span className="text-lg font-black shrink-0"
                  style={{ color: SEVERITY_COLORS[bug.severity] }}>
                  {bug.severity === "critical" ? "⬡" : bug.severity === "high" ? "◆" : "●"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs rounded-full px-2 py-0.5 font-medium"
                      style={{ background: `${SEVERITY_COLORS[bug.severity]}20`, color: SEVERITY_COLORS[bug.severity] }}>
                      {bug.severity}
                    </span>
                    <span className={`text-[10px] rounded-full px-2 py-0.5 border ${isResolved ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                      {isResolved ? "Đã fix" : "Mở"}
                    </span>
                  </div>
                  <p className="text-sm text-white">{bug.content}</p>
                  {bug.task && (
                    <p className="text-xs mt-1" style={{ color: "rgba(209,213,219,0.4)" }}>
                      Task: {bug.task.title}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
                    {VI_DATE.format(new Date(bug.createdAt))}
                  </p>
                  {!isResolved && (
                    <button onClick={() => resolve(bug.id)}
                      className="mt-1 rounded-lg px-3 py-1 text-xs font-bold text-white"
                      style={{ background: "#10B981" }}>
                      ✓ Fix
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
