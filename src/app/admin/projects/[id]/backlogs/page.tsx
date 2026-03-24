"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectHeader } from "@/components/admin/shared/project-header";

interface Props { params: Promise<{ id: string }>; }

interface Epic { id: string; title: string; color: string; totalLp: number; allocatedLp: number; status: string; backlogs: Backlog[]; }
interface Backlog { id: string; name: string; epicId: string | null; totalLp: number; usedLp: number; _count: { tasks: number }; }

export default function ProjectBacklogsPage({ params: paramsPromise }: Props) {
  const [projectId, setProjectId] = useState("");
  const [epics, setEpics] = useState<Epic[]>([]);
  const [backlogs, setBacklogs] = useState<Backlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEpicId, setNewEpicId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { paramsPromise.then(p => setProjectId(p.id)); }, [paramsPromise]);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [e, b] = await Promise.all([
        fetch(`/api/admin/epics?projectId=${projectId}`).then(r => r.json()),
        fetch(`/api/admin/backlogs?projectId=${projectId}`).then(r => r.json()),
      ]);
      setEpics(e.data ?? []);
      setBacklogs(b.data ?? []);
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createBacklog = async () => {
    if (!newName) return;
    setSaving(true);
    await fetch("/api/admin/backlogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, name: newName, title: newName, epicId: newEpicId }),
    });
    setNewName(""); setNewEpicId(null); setShowCreate(false);
    fetchData();
    setSaving(false);
  };

  const nonEpicBacklogs = backlogs.filter(b => !b.epicId);

  return (
    <div className="p-6">
      <ProjectHeader projectId={projectId} className="mb-6" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Backlogs & Epics</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            {backlogs.length} backlogs • {epics.length} epics
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)" }}>
          + Backlog
        </button>
      </div>

      {loading ? (
        <p className="text-center py-20" style={{ color: "rgba(209,213,219,0.3)" }}>Đang tải...</p>
      ) : (
        <div className="space-y-8">
          {/* Non-epic backlogs */}
          {nonEpicBacklogs.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-3" style={{ color: "rgba(209,213,219,0.5)" }}>
                Backlogs không thuộc Epic
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {nonEpicBacklogs.map(b => (
                  <div key={b.id}
                    className="rounded-xl border p-4"
                    style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-white">{b.name}</span>
                      <span className="text-[10px] rounded-full px-2 py-0.5"
                        style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA" }}>
                        {b._count.tasks} tasks
                      </span>
                    </div>
                    {b.totalLp > 0 && (
                      <div className="h-1 rounded-full overflow-hidden mb-1" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${Math.round((b.usedLp / b.totalLp) * 100)}%`, background: "#8B5CF6" }} />
                      </div>
                    )}
                    <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.3)" }}>
                      {b.usedLp}/{b.totalLp}LP
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Epics */}
          {epics.map(epic => (
            <div key={epic.id}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ background: epic.color }} />
                <h2 className="text-sm font-semibold text-white">{epic.title}</h2>
                <span className="text-[10px] rounded-full px-2 py-0.5"
                  style={{ background: epic.color + "20", color: epic.color }}>
                  {epic.backlogs.length} backlogs
                </span>
                {epic.totalLp > 0 && (
                  <span className="text-[10px]" style={{ color: "rgba(139,92,246,0.6)" }}>
                    {epic.allocatedLp}/{epic.totalLp}LP
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 ml-6">
                {epic.backlogs.map(b => (
                  <div key={b.id}
                    className="rounded-xl border p-4"
                    style={{ background: "rgba(255,255,255,0.02)", borderColor: epic.color + "30" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{b.name}</span>
                      <span className="text-[10px] rounded-full px-2 py-0.5"
                        style={{ background: epic.color + "15", color: epic.color }}>
                        {b._count.tasks}
                      </span>
                    </div>
                    {b.totalLp > 0 && (
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${Math.round((b.usedLp / b.totalLp) * 100)}%`, background: epic.color }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {backlogs.length === 0 && epics.length === 0 && (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Chưa có backlog nào</p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-sm rounded-2xl border p-6"
            style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-5">Tạo Backlog</h2>
            <div className="space-y-3">
              <input type="text" value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Tên backlog *"
                className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              <select value={newEpicId ?? ""}
                onChange={e => setNewEpicId(e.target.value || null)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                <option value="">— Không thuộc Epic —</option>
                {epics.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
              </select>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 rounded-lg border py-2.5 text-sm font-medium"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(209,213,219,0.7)" }}>Hủy</button>
              <button onClick={createBacklog} disabled={saving || !newName}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)" }}>
                {saving ? "..." : "Tạo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
