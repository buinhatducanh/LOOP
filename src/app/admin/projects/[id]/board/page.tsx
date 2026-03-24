"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectHeader } from "@/components/admin/shared/project-header";

// ─── Constants ───────────────────────────────────────────────────────────────

const COLUMNS = [
  { key: "backlog", label: "Backlog", color: "#64748b" },
  { key: "in_progress", label: "Đang làm", color: "#3B82F6" },
  { key: "in_review", label: "Review", color: "#F59E0B" },
  { key: "done", label: "Hoàn thành", color: "#10B981" },
] as const;

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-gray-400 bg-gray-500/15",
  medium: "text-blue-400 bg-blue-500/15",
  high: "text-orange-400 bg-orange-500/15",
  urgent: "text-red-400 bg-red-500/15",
};
const PRIORITY_LABELS: Record<string, string> = {
  low: "Thấp", medium: "TB", high: "Cao", urgent: "Gấp",
};

const VI_DATE = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" });

// ─── Types ───────────────────────────────────────────────────────────────────

interface TaskTag { id: string; name: string; color: string; }
interface Backlog { id: string; name: string; epicId: string | null; totalLp: number; usedLp: number; tasks: Task[]; }
interface Epic { id: string; title: string; color: string; status: string; backlogs: Backlog[]; }
interface TeamMember { id: string; name: string; role: string; }

interface Task {
  id: string; title: string; description: string | null;
  lp: number; status: string; priority: string;
  assigneeId: string | null; branchName: string | null;
  slaDeadline: string | null; startedAt: string | null;
  completedAt: string | null; violated: boolean;
  estimatedHours: number | null; actualHours: number | null;
  qualityScore: number | null; externalId: string | null;
  tags: TaskTag[]; backlogId: string;
}

interface KanbanData {
  epics: Epic[];
  backlogs: Backlog[];
  members: TeamMember[];
}

// ─── SLA Countdown ───────────────────────────────────────────────────────────

function SLACountdown({ deadline }: { deadline: string }) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    const calc = () => setDiff(new Date(deadline).getTime() - Date.now());
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [deadline]);

  if (diff < 0) return <span className="text-xs font-bold text-red-400">⚠ Quá deadline!</span>;
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return <span className="text-xs text-green-400">{Math.floor(hours / 24)}d</span>;
  if (hours > 0) return <span className="text-xs text-yellow-400">{hours}h{mins > 0 ? `${mins}m` : ""}</span>;
  return <span className="text-xs font-bold text-red-400">{mins}m</span>;
}

// ─── Task Card ──────────────────────────────────────────────────────────────

function TaskCard({
  task, members, onSelect, onTransition,
}: {
  task: Task; members: TeamMember[];
  onSelect: (t: Task) => void;
  onTransition: (id: string, status: string) => void;
}) {
  const assignee = members.find(m => m.id === task.assigneeId);
  const hasSLA = !!task.slaDeadline && (task.status === "in_progress" || task.status === "in_review");
  const isOverdue = task.slaDeadline && new Date(task.slaDeadline).getTime() < Date.now();

  return (
    <div
      className="group rounded-lg border p-3 cursor-pointer transition-all hover:border-purple-500/50 hover:bg-purple-500/5"
      style={{
        background: task.violated ? "rgba(239,68,68,0.05)" : "rgba(255,255,255,0.03)",
        borderColor: task.violated ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)",
      }}
      onClick={() => onSelect(task)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {task.externalId && (
            <span className="text-[9px] font-mono text-gray-500 shrink-0">{task.externalId}</span>
          )}
          <h4 className="text-xs font-medium text-white line-clamp-2 leading-snug">
            {task.title}
          </h4>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${PRIORITY_COLORS[task.priority] ?? ""}`}>
            {PRIORITY_LABELS[task.priority] ?? task.priority}
          </span>
          {task.violated && (
            <span className="text-[9px] font-bold text-red-400">⚠ VIOLATE</span>
          )}
        </div>
      </div>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map(tag => (
            <span key={tag.id}
              className="rounded px-1 py-0.5 text-[9px] font-medium"
              style={{ background: tag.color + "25", color: tag.color }}>
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* LP badge */}
          {task.lp > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA" }}>
              ⬡ {task.lp}LP
            </span>
          )}
          {/* SLA */}
          {hasSLA && (
            <SLACountdown deadline={task.slaDeadline!} />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Assignee avatar */}
          {assignee ? (
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
              style={{ background: "#6366F1" }}
              title={assignee.name}>
              {assignee.name.slice(0, 2).toUpperCase()}
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border border-dashed flex items-center justify-center"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
              title="Chưa assign">
              <span className="text-[9px]" style={{ color: "rgba(209,213,219,0.3)" }}>?</span>
            </div>
          )}
          {/* Transition button */}
          {task.status !== "done" && (
            <button
              onClick={e => { e.stopPropagation(); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5"
              style={{ color: "rgba(209,213,219,0.5)" }}
              title="Chuyển trạng thái"
            >
              <span className="text-xs">→</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Backlog Column ─────────────────────────────────────────────────────────

function BacklogLane({
  backlog, members, onSelectTask, onTransition,
}: {
  backlog: Backlog; members: TeamMember[];
  onSelectTask: (t: Task) => void;
  onTransition: (id: string, status: string) => void;
}) {
  const tasks = backlog.tasks;
  const isEpicBacklog = !!backlog.epicId;

  return (
    <div className="mb-4">
      {/* Backlog header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] font-semibold text-gray-400">{backlog.name}</span>
        <div className="flex items-center gap-2">
          {backlog.totalLp > 0 && (
            <span className="text-[10px]" style={{ color: "rgba(139,92,246,0.6)" }}>
              {backlog.usedLp}/{backlog.totalLp}LP
            </span>
          )}
          <span className="text-[10px] text-gray-600">{tasks.length}</span>
        </div>
      </div>

      {/* Tasks by status */}
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key);
        return (
          <div key={col.key} className="mb-3">
            {colTasks.length > 0 && (
              <div className="space-y-1.5 pl-2 border-l-2" style={{ borderColor: col.color + "40" }}>
                {colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    members={members}
                    onSelect={onSelectTask}
                    onTransition={onTransition}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Epic Lane ──────────────────────────────────────────────────────────────

function EpicLane({
  epic, members, onSelectTask, onTransition,
}: {
  epic: Epic; members: TeamMember[];
  onSelectTask: (t: Task) => void;
  onTransition: (id: string, status: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const allTasks = epic.backlogs.flatMap(b => b.tasks);
  const doneCount = allTasks.filter(t => t.status === "done").length;
  const progress = allTasks.length > 0 ? Math.round((doneCount / allTasks.length) * 100) : 0;

  return (
    <div className="mb-6 rounded-xl border overflow-hidden" style={{ borderColor: epic.color + "40" }}>
      {/* Epic header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5"
        style={{ background: epic.color + "12" }}
      >
        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: epic.color }} />
        <div className="flex-1 text-left">
          <span className="text-sm font-semibold text-white">{epic.title}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex-1 max-w-[120px] h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: epic.color }} />
            </div>
            <span className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
              {doneCount}/{allTasks.length}
            </span>
          </div>
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ background: epic.color + "20", color: epic.color }}>
          {progress}%
        </span>
        <span className="text-xs" style={{ color: "rgba(209,213,219,0.3)" }}>
          {collapsed ? "▶" : "▼"}
        </span>
      </button>

      {/* Backlogs */}
      {!collapsed && (
        <div className="px-4 py-3" style={{ background: "rgba(0,0,0,0.2)" }}>
          {epic.backlogs.map(backlog => (
            <BacklogLane
              key={backlog.id}
              backlog={backlog}
              members={members}
              onSelectTask={onSelectTask}
              onTransition={onTransition}
            />
          ))}
          {epic.backlogs.length === 0 && (
            <p className="text-center py-4 text-xs" style={{ color: "rgba(209,213,219,0.2)" }}>
              Chưa có backlog
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Task Detail Modal ──────────────────────────────────────────────────────

function TaskDetailModal({
  task, members, backlog, onClose, onTransition, onRevoke,
}: {
  task: Task; members: TeamMember[];
  backlog?: Backlog;
  onClose: () => void;
  onTransition: (id: string, status: string, note?: string, score?: number) => void;
  onRevoke: (id: string, reason: string, lp: number) => void;
}) {
  const [note, setNote] = useState("");
  const [score, setScore] = useState(8);
  const assignee = members.find(m => m.id === task.assigneeId);

  const nextStatus = {
    backlog: "in_progress",
    in_progress: "in_review",
    in_review: "done",
    done: "in_progress",
  }[task.status] as string;

  const nextLabel = {
    backlog: "Bắt đầu làm",
    in_progress: "Gửi Review",
    in_review: "Hoàn thành",
    done: "Mở lại",
  }[task.status] as string;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border p-6 max-h-[90vh] overflow-y-auto"
        style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="min-w-0 flex-1 mr-3">
            {task.externalId && (
              <p className="text-[10px] font-mono mb-1" style={{ color: "rgba(209,213,219,0.4)" }}>{task.externalId}</p>
            )}
            <h2 className="text-base font-bold text-white">{task.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white shrink-0">✕</button>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium border ${PRIORITY_COLORS[task.priority]}`}>
            {PRIORITY_LABELS[task.priority]} Priority
          </span>
          <span className="rounded-full px-2 py-0.5 text-xs font-medium border"
            style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA", borderColor: "rgba(139,92,246,0.3)" }}>
            ⬡ {task.lp}LP
          </span>
          {task.violated && (
            <span className="rounded-full px-2 py-0.5 text-xs font-bold text-red-400 bg-red-500/15 border border-red-500/30">
              ⚠ VIOLATED
            </span>
          )}
          {assignee && (
            <span className="rounded-full px-2 py-0.5 text-xs"
              style={{ background: "rgba(99,102,241,0.15)", color: "#818CF8" }}>
              👤 {assignee.name}
            </span>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <div className="rounded-lg border p-3 mb-4" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
            <p className="text-xs leading-relaxed text-gray-300 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        {/* Details */}
        <div className="space-y-2 text-sm mb-5">
          {[
            ["Backlog", backlog?.name ?? "—"],
            ["Branch", task.branchName ?? "—"],
            ["Estimate", task.estimatedHours ? `${task.estimatedHours}h` : "—"],
            ["Actual", task.actualHours ? `${task.actualHours}h` : "—"],
            ["SLA", task.slaDeadline ? `${VI_DATE.format(new Date(task.slaDeadline))}` : "—"],
            ["Done", task.completedAt ? `${VI_DATE.format(new Date(task.completedAt))}` : "—"],
            ["Quality", task.qualityScore ? `${task.qualityScore}/10` : "—"],
          ].map(([label, value]) => (
            <div key={label as string} className="flex justify-between">
              <span style={{ color: "rgba(209,213,219,0.4)" }}>{label}</span>
              <span className="text-white text-xs">{value}</span>
            </div>
          ))}
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {task.tags.map(tag => (
              <span key={tag.id} className="rounded px-2 py-0.5 text-xs font-medium"
                style={{ background: tag.color + "20", color: tag.color }}>
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Complete form (when moving to done) */}
        {task.status === "in_review" && (
          <div className="rounded-lg border p-4 mb-4" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
            <p className="text-xs font-semibold mb-3" style={{ color: "rgba(209,213,219,0.6)" }}>Hoàn thành task</p>
            <div className="mb-3">
              <label className="text-xs mb-1 block" style={{ color: "rgba(209,213,219,0.5)" }}>Chất lượng (1-10)</label>
              <div className="flex gap-1">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button key={n} onClick={() => setScore(n)}
                    className="w-8 h-8 rounded text-xs font-bold transition-all"
                    style={{
                      background: score === n ? "#10B981" : "rgba(255,255,255,0.05)",
                      color: score === n ? "#fff" : "rgba(209,213,219,0.5)",
                    }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Ghi chú khi hoàn thành (tuỳ chọn)..."
              rows={2}
              className="w-full rounded-lg border px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-green-500"
              style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", resize: "none" }} />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={() => onClose()}
            className="flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(209,213,219,0.7)" }}>
            Đóng
          </button>
          <button
            onClick={() => {
              if (task.status === "in_review") {
                onTransition(task.id, nextStatus, note, score);
              } else {
                onTransition(task.id, nextStatus);
              }
              onClose();
            }}
            className="flex-1 rounded-lg py-2.5 text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: task.status === "in_review" ? "#10B981" : "#3B82F6" }}>
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Board Page ────────────────────────────────────────────────────────

interface BoardPageProps { params: Promise<{ id: string }> }

export default function KanbanBoardPage({ params: paramsPromise }: BoardPageProps) {
  const [projectId, setProjectId] = useState<string>("");
  const [data, setData] = useState<KanbanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEpic, setShowEpic] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [newTask, setNewTask] = useState({ title: "", backlogId: "", priority: "medium", lp: "0" });
  const [newEpic, setNewEpic] = useState({ title: "", color: "#8B5CF6" });

  useEffect(() => {
    paramsPromise.then(p => setProjectId(p.id));
  }, [paramsPromise]);

  const fetchBoard = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [epicsRes, backlogsRes, membersRes] = await Promise.all([
        fetch(`/api/admin/epics?projectId=${projectId}`),
        fetch(`/api/admin/backlogs?projectId=${projectId}`),
        fetch(`/api/admin/team`),
      ]);
      const [epicsData, backlogsData, membersData] = await Promise.all([
        epicsRes.json(), backlogsRes.json(), membersRes.json(),
      ]);
      setData({
        epics: epicsData.data ?? [],
        backlogs: (backlogsData.data ?? []).filter((b: Backlog) => !b.epicId),
        members: membersData.data ?? [],
      });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

  const transitionTask = async (id: string, status: string, note?: string, score?: number) => {
    const body: Record<string, unknown> = { status };
    if (note) body.completionNote = note;
    if (score) body.qualityScore = score;
    await fetch(`/api/admin/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    fetchBoard();
  };

  const revokeTask = async (id: string, reason: string, lp: number) => {
    await fetch(`/api/admin/tasks/${id}/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "scope_creep", description: reason, revokedLp: lp }),
    });
    fetchBoard();
    setSelectedTask(null);
  };

  const createTask = async () => {
    if (!newTask.title || !newTask.backlogId) return;
    setSaving(true);
    await fetch("/api/admin/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newTask, lp: parseInt(newTask.lp) || 0 }),
    });
    setShowCreateTask(false);
    setNewTask({ title: "", backlogId: "", priority: "medium", lp: "0" });
    fetchBoard();
    setSaving(false);
  };

  const createEpic = async () => {
    if (!newEpic.title) return;
    setSaving(true);
    await fetch("/api/admin/epics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, title: newEpic.title, color: newEpic.color }),
    });
    setShowEpic(false);
    setNewEpic({ title: "", color: "#8B5CF6" });
    fetchBoard();
    setSaving(false);
  };

  const allBacklogs = [...(data?.epics.flatMap(e => e.backlogs) ?? []), ...(data?.backlogs ?? [])];
  const selectedBacklog = allBacklogs.find(b => b.id === selectedTask?.backlogId);

  return (
    <div className="p-6 min-h-screen" style={{ background: "#09090f" }}>
      {/* Project Header */}
      <ProjectHeader projectId={projectId} className="mb-6" />

      {/* Board toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Kanban Board</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            {allBacklogs.reduce((s, b) => s + b.tasks.length, 0)} tasks
            {data?.epics && ` • ${data.epics.length} epics`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowEpic(true)}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,0.15)", color: "rgba(209,213,219,0.7)" }}>
            + Epic
          </button>
          <button onClick={() => setShowCreateTask(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)" }}>
            + Task
          </button>
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <p className="text-center py-20" style={{ color: "rgba(209,213,219,0.3)" }}>Đang tải board...</p>
      ) : (
        <div className="space-y-2">
          {/* Non-epic backlogs (top-level) */}
          {data?.backlogs.map(backlog => (
            <div key={backlog.id}
              className="rounded-xl border p-4"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-300">{backlog.name}</span>
                {backlog.totalLp > 0 && (
                  <span className="text-xs" style={{ color: "rgba(139,92,246,0.6)" }}>
                    {backlog.usedLp}/{backlog.totalLp}LP
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {COLUMNS.map(col => {
                  const colTasks = backlog.tasks.filter(t => t.status === col.key);
                  return (
                    <div key={col.key}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                        <span className="text-xs font-semibold" style={{ color: col.color }}>{col.label}</span>
                        <span className="text-[10px] text-gray-600 ml-auto">{colTasks.length}</span>
                      </div>
                      <div className="space-y-2">
                        {colTasks.map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            members={data.members}
                            onSelect={setSelectedTask}
                            onTransition={transitionTask}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Epic Lanes */}
          {data?.epics.map(epic => (
            <EpicLane
              key={epic.id}
              epic={epic}
              members={data.members}
              onSelectTask={setSelectedTask}
              onTransition={transitionTask}
            />
          ))}

          {allBacklogs.length === 0 && (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>
                Chưa có backlog nào. Tạo backlog hoặc epic để bắt đầu.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          members={data?.members ?? []}
          backlog={selectedBacklog}
          onClose={() => setSelectedTask(null)}
          onTransition={transitionTask}
          onRevoke={revokeTask}
        />
      )}

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowCreateTask(false)}>
          <div className="w-full max-w-md rounded-2xl border p-6" style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-5">Tạo Task mới</h2>
            <div className="space-y-3">
              <input type="text" value={newTask.title}
                onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))}
                placeholder="Tiêu đề task *"
                className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              <select value={newTask.backlogId}
                onChange={e => setNewTask(t => ({ ...t, backlogId: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2.5 text-sm text-white outline-none"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                <option value="">— Chọn Backlog —</option>
                {allBacklogs.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select value={newTask.priority}
                  onChange={e => setNewTask(t => ({ ...t, priority: e.target.value }))}
                  className="rounded-lg border px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <input type="number" value={newTask.lp}
                  onChange={e => setNewTask(t => ({ ...t, lp: e.target.value }))}
                  placeholder="LP (0 = ko award)"
                  className="rounded-lg border px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreateTask(false)}
                className="flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(209,213,219,0.7)" }}>Hủy</button>
              <button onClick={createTask} disabled={saving || !newTask.title || !newTask.backlogId}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)" }}>
                {saving ? "Đang lưu..." : "Tạo Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Epic Modal */}
      {showEpic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setShowEpic(false)}>
          <div className="w-full max-w-sm rounded-2xl border p-6" style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-5">Tạo Epic mới</h2>
            <div className="space-y-3">
              <input type="text" value={newEpic.title}
                onChange={e => setNewEpic(prev => ({ ...prev, title: (e.target as HTMLInputElement).value }))}
                placeholder="Tên Epic *"
                className="w-full rounded-lg border px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-500"
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "rgba(209,213,219,0.5)" }}>Màu</label>
                <div className="flex gap-2">
                  {["#8B5CF6","#EC4899","#F59E0B","#10B981","#3B82F6","#EF4444","#06B6D4","#F97316"].map(c => (
                    <button key={c} onClick={() => setNewEpic(e => ({ ...e, color: c }))}
                      className="w-8 h-8 rounded-full transition-transform"
                      style={{
                        background: c,
                        transform: newEpic.color === c ? "scale(1.2)" : "scale(1)",
                        outline: newEpic.color === c ? `2px solid ${c}` : "none",
                      }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowEpic(false)}
                className="flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(209,213,219,0.7)" }}>Hủy</button>
              <button onClick={createEpic} disabled={saving || !newEpic.title}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: newEpic.color }}>
                {saving ? "..." : "Tạo Epic"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
