"use client";

import { useState, useEffect } from "react";

const VI_DATE = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit",
});

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  deadline_missed: { bg: "rgba(239,68,68,0.15)", color: "#EF4444" },
  sla_breach: { bg: "rgba(249,115,22,0.15)", color: "#F97316" },
};

interface Violation {
  id: string; taskId: string; type: string; note: string | null;
  revokedLp: number;
  createdAt: string;
  task?: { id: string; title: string; status: string };
}

export default function TaskViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/task-violations")
      .then(r => r.json())
      .then(j => setViolations(j.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const typeLabels: Record<string, string> = {
    deadline_missed: "Deadline miss",
    sla_breach: "SLA breach",
  };

  const totalRevoked = violations.reduce((s, v) => s + v.revokedLp, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">SLA Violations</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            {violations.length} violations · ⬡{totalRevoked} LP revoked
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl px-4 py-2"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <span className="text-xl">⚠</span>
          <span className="text-sm font-bold text-red-400">{violations.length}</span>
          <span className="text-xs" style={{ color: "rgba(239,68,68,0.6)" }}>violations</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {Object.entries(typeLabels).map(([type, label]) => {
          const count = violations.filter(v => v.type === type).length;
          const colors = TYPE_COLORS[type] ?? TYPE_COLORS.deadline_missed;
          return (
            <div key={type} className="rounded-xl border p-4 text-center"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
              <p className="text-2xl font-black" style={{ color: colors.color }}>{count}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>{label}</p>
            </div>
          );
        })}
      </div>

      {/* Violation list */}
      {loading ? (
        <p className="text-center py-20" style={{ color: "rgba(209,213,219,0.3)" }}>Đang tải...</p>
      ) : violations.length === 0 ? (
        <div className="text-center py-20 rounded-xl border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-4xl mb-3">✓</p>
          <p className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>
            Không có vi phạm nào · Mọi thứ hoạt động tốt!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {violations.map(v => {
            const colors = TYPE_COLORS[v.type] ?? TYPE_COLORS.deadline_missed;
            return (
              <div key={v.id}
                className="rounded-xl border p-5"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-start gap-4">
                  <span className="text-xl" style={{ color: colors.color }}>⚠</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs rounded-full px-2 py-0.5 font-medium"
                        style={{ background: colors.bg, color: colors.color }}>
                        {typeLabels[v.type] ?? v.type}
                      </span>
                      {v.revokedLp > 0 && (
                        <span className="text-xs rounded-full px-2 py-0.5"
                          style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
                          -⬡{v.revokedLp}
                        </span>
                      )}
                    </div>
                    {v.note && (
                      <p className="text-sm text-white mb-1">{v.note}</p>
                    )}
                    {v.task && (
                      <p className="text-xs" style={{ color: "rgba(209,213,219,0.5)" }}>
                        Task: {v.task.title}
                      </p>
                    )}
                  </div>
                  <p className="text-xs shrink-0" style={{ color: "rgba(209,213,219,0.4)" }}>
                    {VI_DATE.format(new Date(v.createdAt))}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
