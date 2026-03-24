"use client";

import { useState, useEffect, useCallback } from "react";

interface Standup {
  id: string; projectId: string; memberId: string; date: string;
  yesterdayDone?: string; todayPlan?: string; blockers?: string;
  member?: { id: string; name: string; email: string };
  project?: { id: string; orderNumber: string; customerName: string };
}

const VI_DATE = new Intl.DateTimeFormat("vi-VN", {
  weekday: "short", day: "2-digit", month: "2-digit", year: "numeric",
});

export default function DailyStandupsPage() {
  const [standups, setStandups] = useState<Standup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ date: "", projectId: "" });
  const [projects, setProjects] = useState<{ id: string; orderNumber: string; customerName: string }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.date) params.set("from", filter.date);
      if (filter.projectId) params.set("projectId", filter.projectId);
      const res = await fetch(`/api/admin/daily-standups?${params}`);
      const json = await res.json();
      setStandups(json.data ?? []);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then(r => r.json())
      .then(j => setProjects(j.data ?? []));
  }, []);

  const byDate = standups.reduce<Record<string, Standup[]>>((acc, s) => {
    const key = s.date.split("T")[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
  const blockers = standups.filter(s => s.blockers && s.blockers.trim().length > 0);
  const today = new Date().toISOString().split("T")[0];
  const todayStandups = standups.filter(s => s.date.startsWith(today));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Daily Standups</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            Tổng hợp standup toàn công ty
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl px-4 py-2"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <span className="text-sm font-medium text-white">{todayStandups.length}</span>
          <span className="text-xs" style={{ color: "rgba(209,213,219,0.5)" }}>standups hôm nay</span>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <div>
          <label className="text-[10px] font-medium block mb-1" style={{ color: "rgba(209,213,219,0.4)" }}>Ngày</label>
          <input type="date" value={filter.date} onChange={e => setFilter(f => ({ ...f, date: e.target.value }))}
            className="rounded-lg border px-3 py-1.5 text-sm text-white"
            style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
        </div>
        <div>
          <label className="text-[10px] font-medium block mb-1" style={{ color: "rgba(209,213,219,0.4)" }}>Dự án</label>
          <select value={filter.projectId} onChange={e => setFilter(f => ({ ...f, projectId: e.target.value }))}
            className="rounded-lg border px-3 py-1.5 text-sm text-white"
            style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
            <option value="">Tất cả dự án</option>
            {projects.map(o => <option key={o.id} value={o.id}>{o.orderNumber}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={fetchData}
            className="rounded-lg border px-4 py-1.5 text-sm text-white border-white/10 hover:bg-white/5 transition-colors">
            Lọc
          </button>
        </div>
      </div>

      {blockers.length > 0 && (
        <div className="rounded-xl border p-4 mb-6"
          style={{ background: "rgba(245,158,11,0.1)", borderColor: "rgba(245,158,11,0.3)" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚠</span>
            <p className="text-sm font-semibold text-yellow-400">{blockers.length} blocker(s)</p>
          </div>
          <div className="space-y-2">
            {blockers.slice(0, 5).map(b => (
              <div key={b.id} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: "#6366F1" }}>
                  {b.member?.name?.slice(0, 2).toUpperCase() ?? "??"}
                </div>
                <div>
                  <p className="text-xs text-yellow-300">{b.blockers}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(245,158,11,0.6)" }}>
                    {b.member?.name} · {b.project?.orderNumber}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center py-20" style={{ color: "rgba(209,213,219,0.3)" }}>Đang tải...</p>
      ) : sortedDates.length === 0 ? (
        <div className="text-center py-20 rounded-xl border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Không có standup nào</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => {
            const dayStandups = byDate[date];
            return (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    date === today ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-gray-400"
                  }`}>
                    {VI_DATE.format(new Date(date + "T00:00:00"))}
                  </span>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <span className="text-[10px]" style={{ color: "rgba(209,213,219,0.3)" }}>
                    {dayStandups.length} standup{dayStandups.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-2">
                  {dayStandups.map(s => (
                    <div key={s.id}
                      className="rounded-xl border p-4"
                      style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: "#6366F1" }}>
                          {s.member?.name?.slice(0, 2).toUpperCase() ?? "??"}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{s.member?.name ?? "Unknown"}</p>
                          {s.project && (
                            <p className="text-[10px]" style={{ color: "rgba(139,92,246,0.7)" }}>
                              {s.project.orderNumber} · {s.project.customerName}
                            </p>
                          )}
                        </div>
                        {s.blockers && (
                          <span className="text-yellow-400 text-sm">⚠</span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {s.yesterdayDone && (
                          <div>
                            <p className="text-[10px] font-medium text-red-400 mb-1">◀ Hôm qua</p>
                            <p className="text-xs" style={{ color: "rgba(209,213,219,0.7)" }}>{s.yesterdayDone}</p>
                          </div>
                        )}
                        {s.todayPlan && (
                          <div>
                            <p className="text-[10px] font-medium text-green-400 mb-1">▶ Hôm nay</p>
                            <p className="text-xs" style={{ color: "rgba(209,213,219,0.7)" }}>{s.todayPlan}</p>
                          </div>
                        )}
                        {s.blockers && (
                          <div>
                            <p className="text-[10px] font-medium text-yellow-400 mb-1">⚠ Blockers</p>
                            <p className="text-xs text-yellow-300">{s.blockers}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
