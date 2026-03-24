"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectHeader } from "@/components/admin/shared/project-header";

interface Props { params: Promise<{ id: string }>; }

interface Member { id: string; name: string; email: string; }
interface Standup {
  id: string; projectId: string; memberId: string; date: string;
  yesterdayDone?: string; todayPlan?: string; blockers?: string;
  member?: Member;
}

const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;
const VI_DATE = new Intl.DateTimeFormat("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });

function getWeekDates(base: Date): Date[] {
  const d = new Date(base);
  d.setDate(d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d); x.setDate(d.getDate() + i); return x;
  });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function StandupsPage({ params: paramsPromise }: Props) {
  const [projectId, setProjectId] = useState("");
  const [standups, setStandups] = useState<Standup[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editStandup, setEditStandup] = useState<Standup | null>(null);
  const [form, setForm] = useState({ memberId: "", yesterdayDone: "", todayPlan: "", blockers: "" });

  useEffect(() => { paramsPromise.then(p => setProjectId(p.id)); }, [paramsPromise]);

  const weekDates = getWeekDates(new Date(Date.now() + weekOffset * 7 * 86400000));

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [sRes, pRes] = await Promise.all([
        fetch(`/api/admin/daily-standups?projectId=${projectId}`),
        fetch(`/api/admin/projects/${projectId}/members`).catch(() => ({ ok: false, json: async () => ({ data: [] }) })),
      ]);
      const sJson = await sRes.json();
      const pJson = pRes.ok ? await pRes.json() : { data: [] };
      setStandups(sJson.data ?? []);
      setMembers(pJson.data ?? []);
    } finally { setLoading(false) }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = (date: Date) => {
    setEditStandup(null);
    setForm({ memberId: members[0]?.id ?? "", yesterdayDone: "", todayPlan: "", blockers: "" });
    setModalOpen(true);
  };

  const openEdit = (s: Standup) => {
    setEditStandup(s);
    setForm({ memberId: s.memberId, yesterdayDone: s.yesterdayDone ?? "", todayPlan: s.todayPlan ?? "", blockers: s.blockers ?? "" });
    setModalOpen(true);
  };

  const save = async () => {
    if (!projectId) return;
    const url = editStandup
      ? `/api/admin/daily-standups/${editStandup.id}`
      : `/api/admin/daily-standups`;
    await fetch(url, {
      method: editStandup ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        projectId,
        date: weekDates[0].toISOString(),
      }),
    });
    setModalOpen(false);
    fetchData();
  };

  const remove = async (id: string) => {
    if (!confirm("Xóa standup này?")) return;
    await fetch(`/api/admin/daily-standups/${id}`, { method: "DELETE" });
    fetchData();
  };

  const today = new Date();
  const hasToday = weekDates.some(d => isSameDay(d, today));

  return (
    <div className="p-6">
      <ProjectHeader projectId={projectId} className="mb-6" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Daily Standups</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            Tuần làm việc {VI_DATE.format(weekDates[0])} – {VI_DATE.format(weekDates[6])}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(o => o - 1)}
            className="rounded-lg border px-3 py-2 text-white text-sm hover:bg-white/5 transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            ← Tuần trước
          </button>
          <button onClick={() => setWeekOffset(0)}
            className="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
            style={{
              borderColor: weekOffset === 0 ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.1)",
              background: weekOffset === 0 ? "rgba(139,92,246,0.15)" : "transparent",
              color: weekOffset === 0 ? "#fff" : "rgba(209,213,219,0.6)",
            }}>
            Hiện tại
          </button>
          <button onClick={() => setWeekOffset(o => o + 1)}
            className="rounded-lg border px-3 py-2 text-white text-sm hover:bg-white/5 transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            Tuần sau →
          </button>
        </div>
      </div>

      {/* Member rows */}
      <div className="space-y-4">
        {members.map(member => {
          const memberStandups = standups.filter(s => s.memberId === member.id);
          return (
            <div key={member.id}
              className="rounded-xl border overflow-hidden"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
              {/* Member header */}
              <div className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: "#6366F1" }}>
                  {member.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{member.name}</p>
                  <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>{member.email}</p>
                </div>
                <div className="ml-auto flex gap-1">
                  {weekDates.map(d => {
                    const s = memberStandups.find(s => isSameDay(new Date(s.date), d));
                    return (
                      <button key={d.toISOString()} onClick={() => s ? openEdit(s) : openCreate(d)}
                        className="w-8 h-8 rounded text-[10px] font-medium transition-all hover:scale-110"
                        style={{
                          background: s ? "rgba(16,185,129,0.2)" :
                            isSameDay(d, today) ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)",
                          color: s ? "#10B981" : isSameDay(d, today) ? "#A78BFA" : "rgba(209,213,219,0.3)",
                          border: isSameDay(d, today) ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent",
                        }}>
                        {d.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Today's standup detail preview */}
              {memberStandups.filter(s => isSameDay(new Date(s.date), today)).map(s => (
                <div key={s.id} className="px-4 py-3">
                  {s.yesterdayDone && (
                    <div className="mb-2">
                      <span className="text-[10px] font-medium text-red-400">◀ Hôm qua:</span>
                      <p className="text-xs mt-0.5 ml-3" style={{ color: "rgba(209,213,219,0.7)" }}>{s.yesterdayDone}</p>
                    </div>
                  )}
                  {s.todayPlan && (
                    <div className="mb-2">
                      <span className="text-[10px] font-medium text-green-400">▶ Hôm nay:</span>
                      <p className="text-xs mt-0.5 ml-3" style={{ color: "rgba(209,213,219,0.7)" }}>{s.todayPlan}</p>
                    </div>
                  )}
                  {s.blockers && (
                    <div>
                      <span className="text-[10px] font-medium text-yellow-400">⚠ Blockers:</span>
                      <p className="text-xs mt-0.5 ml-3 text-yellow-300">{s.blockers}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
        {members.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Chưa có thành viên dự án</p>
          </div>
        )}
      </div>

      {/* Week day headers summary bar */}
      <div className="mt-4 flex gap-1">
        {weekDates.map(d => (
          <div key={d.toISOString()} className="flex-1 text-center">
            <p className="text-[10px]" style={{ color: isSameDay(d, today) ? "#A78BFA" : "rgba(209,213,219,0.4)" }}>
              {DAYS[d.getDay()]}
            </p>
            <p className="text-xs font-bold" style={{ color: isSameDay(d, today) ? "#A78BFA" : "rgba(209,213,219,0.6)" }}>
              {d.getDate()}
            </p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl border p-6 w-full max-w-md"
            style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}>
            <h2 className="text-lg font-bold text-white mb-4">
              {editStandup ? "Sửa Standup" : "Tạo Standup"}
            </h2>
            <div className="space-y-3">
              {!editStandup && (
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: "rgba(209,213,219,0.6)" }}>Thành viên</label>
                  <select value={form.memberId} onChange={e => setForm(f => ({ ...f, memberId: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "rgba(209,213,219,0.6)" }}>◀ Hôm qua đã làm</label>
                <textarea value={form.yesterdayDone} onChange={e => setForm(f => ({ ...f, yesterdayDone: e.target.value }))}
                  rows={2} placeholder="..."
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "rgba(209,213,219,0.6)" }}>▶ Hôm nay sẽ làm</label>
                <textarea value={form.todayPlan} onChange={e => setForm(f => ({ ...f, todayPlan: e.target.value }))}
                  rows={2} placeholder="..."
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "rgba(209,213,219,0.6)" }}>⚠ Blockers</label>
                <textarea value={form.blockers} onChange={e => setForm(f => ({ ...f, blockers: e.target.value }))}
                  rows={2} placeholder="Không có..."
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={save}
                className="flex-1 rounded-lg py-2 text-sm font-bold text-white"
                style={{ background: "#6366F1" }}>
                {editStandup ? "Lưu" : "Tạo"}
              </button>
              {editStandup && (
                <button onClick={() => remove(editStandup.id)}
                  className="rounded-lg border px-3 py-2 text-sm text-red-400 border-red-500/30">
                  Xóa
                </button>
              )}
              <button onClick={() => setModalOpen(false)}
                className="rounded-lg border px-4 py-2 text-sm text-gray-400 border-white/10">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
