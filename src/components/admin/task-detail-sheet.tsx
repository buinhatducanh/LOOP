"use client";

import { useState } from "react";
import { toast } from "sonner";

const VI_DATE = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
});

const STATUS_COLORS: Record<string, string> = {
  backlog: "#94a3b8", in_progress: "#60a5fa", in_review: "#f59e0b", done: "#10B981",
};
const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog", in_progress: "Đang làm", in_review: "Review", done: "Hoàn thành",
};
const PRIORITY_COLORS: Record<string, string> = {
  low: "#94a3b8", medium: "#60a5fa", high: "#f97316", critical: "#ef4444",
};
const NEXT_TRANSITION: Record<string, { label: string; color: string }> = {
  backlog: { label: "Bắt đầu làm", color: "#3B82F6" },
  in_progress: { label: "Gửi Review", color: "#F59E0B" },
  in_review: { label: "Hoàn thành", color: "#10B981" },
  done: { label: "Mở lại", color: "#6B7280" },
};

export interface TaskDetailData {
  id: string;
  title: string;
  description: string | null;
  lp: number;
  status: string;
  priority: string;
  violated: boolean;
  slaDeadline: string | null;
  completedAt: string | null;
  branchName: string | null;
  externalId: string | null;
  estimatedHours: number | null;
  createdAt: string;
  updatedAt: string;
  tags: { id: string; name: string; color: string }[];
  backlog: {
    id: string; name: string; title: string;
    project: { id: string; orderNumber: string; customerName: string };
  };
  assignee?: { id: string; name: string } | null;
  bugNotes?: {
    id: string; content: string; severity: string; status: string;
    createdAt: string; resolvedAt: string | null;
    author: { id: string; name: string };
  }[];
  commits?: {
    id: string; sha: string; message: string; authorName: string;
    branch: string; mergedToMain: boolean; committedAt: string;
  }[];
  lpAwards?: {
    id: string; lpAmount: number; expAmount: number;
    source: string; status: string; createdAt: string;
  }[];
}

interface TaskDetailSheetProps {
  task: TaskDetailData;
  members: { id: string; name: string }[];
  onClose: () => void;
  onTransition: (id: string, status: string, note?: string, score?: number) => Promise<void>;
  onAssign?: (id: string, assigneeId: string | null) => Promise<void>;
  onAddBugNote?: (taskId: string, content: string, severity: string) => Promise<void>;
  onResolveBugNote?: (noteId: string) => Promise<void>;
}

type Tab = "overview" | "bug-notes" | "commits" | "lp";

export function TaskDetailSheet({
  task, members, onClose, onTransition, onAssign, onAddBugNote, onResolveBugNote,
}: TaskDetailSheetProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const [transitioning, setTransitioning] = useState(false);
  const [note, setNote] = useState("");
  const [score, setScore] = useState(8);
  const [assigneeId, setAssigneeId] = useState(task.assignee?.id ?? "");
  const [assigning, setAssigning] = useState(false);
  const [bugContent, setBugContent] = useState("");
  const [bugSeverity, setBugSeverity] = useState("medium");
  const [addingBug, setAddingBug] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const next = NEXT_TRANSITION[task.status];
  const assignee = task.assignee;

  const handleTransition = async () => {
    setTransitioning(true);
    try {
      const extraNote = task.status === "in_review" ? note : undefined;
      const extraScore = task.status === "in_review" ? score : undefined;
      await onTransition(task.id, next.label === "Mở lại" ? "in_progress" : next.label === "Bắt đầu làm" ? "in_progress" : next.label === "Gửi Review" ? "in_review" : "done", extraNote, extraScore);
      onClose();
    } finally {
      setTransitioning(false);
    }
  };

  const handleAssign = async () => {
    setAssigning(true);
    try {
      await onAssign?.(task.id, assigneeId || null);
      setShowAssign(false);
    } finally {
      setAssigning(false);
    }
  };

  const handleAddBug = async () => {
    if (!bugContent.trim()) return;
    setAddingBug(true);
    try {
      await onAddBugNote?.(task.id, bugContent.trim(), bugSeverity);
      setBugContent("");
      setBugSeverity("medium");
    } finally {
      setAddingBug(false);
    }
  };

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: "overview", label: "Chi tiết" },
    { key: "bug-notes", label: "Bug Notes", badge: task.bugNotes?.length },
    { key: "commits", label: "Commits", badge: task.commits?.length },
    { key: "lp", label: "LP Awards", badge: task.lpAwards?.length },
  ];

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.6)" }}>
      {/* Sheet */}
      <div
        className="ml-auto w-full max-w-lg h-full flex flex-col rounded-l-2xl overflow-hidden shadow-2xl"
        style={{ background: "#0f0f1a", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex-1 min-w-0">
            {task.externalId && (
              <p className="text-[10px] font-mono mb-1" style={{ color: "rgba(209,213,219,0.35)" }}>
                {task.externalId}
              </p>
            )}
            <h2 className="text-base font-bold text-white leading-snug">{task.title}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-[10px] rounded-full px-1.5 py-0.5 font-medium"
                style={{ background: (STATUS_COLORS[task.status] ?? "#94a3b8") + "20", color: STATUS_COLORS[task.status] }}>
                {STATUS_LABELS[task.status]}
              </span>
              <span className="text-[10px] rounded-full px-1.5 py-0.5 font-medium border"
                style={{ background: (PRIORITY_COLORS[task.priority] ?? "#94a3b8") + "15", color: PRIORITY_COLORS[task.priority], borderColor: (PRIORITY_COLORS[task.priority] ?? "#94a3b8") + "30" }}>
                {task.priority}
              </span>
              {task.lp > 0 && (
                <span className="text-[10px] rounded-full px-1.5 py-0.5 font-bold"
                  style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA" }}>
                  ⬡{task.lp}LP
                </span>
              )}
              {task.violated && (
                <span className="text-[10px] rounded-full px-1.5 py-0.5 font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                  ⚠ VIOLATED
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors"
            style={{ color: "rgba(209,213,219,0.5)", background: "rgba(255,255,255,0.05)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(209,213,219,0.5)"; }}>
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="relative px-3 py-2 text-xs font-medium rounded-t-lg transition-colors"
              style={{
                color: tab === t.key ? "#fff" : "rgba(209,213,219,0.4)",
                background: tab === t.key ? "rgba(139,92,246,0.15)" : "transparent",
              }}>
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className="ml-1 text-[9px] rounded-full px-1 py-0.5 font-bold"
                  style={{ background: "rgba(139,92,246,0.3)", color: "#A78BFA" }}>
                  {t.badge}
                </span>
              )}
              {tab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "#8B5CF6" }} />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div className="space-y-4">
              {/* Assignee */}
              <div className="flex items-center justify-between rounded-lg border p-3"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "rgba(209,213,219,0.5)" }}>Assignee</span>
                </div>
                {showAssign ? (
                  <div className="flex items-center gap-2">
                    <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
                      className="rounded border px-2 py-1 text-xs text-white outline-none"
                      style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.15)" }}>
                      <option value="">— Unassign —</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <button onClick={handleAssign} disabled={assigning}
                      className="rounded px-2 py-1 text-xs font-medium text-white"
                      style={{ background: "#10B981" }}>
                      {assigning ? "..." : "✓"}
                    </button>
                    <button onClick={() => setShowAssign(false)}
                      className="rounded px-2 py-1 text-xs" style={{ color: "rgba(209,213,219,0.5)" }}>
                      ✕
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowAssign(true)} className="flex items-center gap-2">
                    {assignee ? (
                      <>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ background: "#6366F1" }}>
                          {assignee.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs text-white">{assignee.name}</span>
                      </>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded border" style={{ color: "rgba(209,213,219,0.4)", borderColor: "rgba(255,255,255,0.1)" }}>
                        Chưa assign
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Description */}
              {task.description && (
                <div className="rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-xs leading-relaxed text-gray-300 whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              {/* Meta grid */}
              <div className="rounded-lg border divide-y" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" } as React.CSSProperties}>
                {[
                  ["Backlog", task.backlog.name || task.backlog.title],
                  ["Project", task.backlog.project.orderNumber + " · " + task.backlog.project.customerName],
                  ["Branch", task.branchName ?? "—"],
                  ["SLA", task.slaDeadline ? VI_DATE.format(new Date(task.slaDeadline)) : "—"],
                  ["Done", task.completedAt ? VI_DATE.format(new Date(task.completedAt)) : "—"],
                  ["Estimate", task.estimatedHours ? `${task.estimatedHours}h` : "—"],
                  ["Created", VI_DATE.format(new Date(task.createdAt))],
                  ["Updated", VI_DATE.format(new Date(task.updatedAt))],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between px-3 py-2">
                    <span className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>{label}</span>
                    <span className="text-xs text-white font-medium text-right max-w-[60%] truncate">{value as string}</span>
                  </div>
                ))}
              </div>

              {/* Tags */}
              {task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {task.tags.map(tag => (
                    <span key={tag.id}
                      className="rounded px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: tag.color + "20", color: tag.color }}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Completion form */}
              {task.status === "in_review" && (
                <div className="rounded-lg border p-4 space-y-3"
                  style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-xs font-semibold" style={{ color: "rgba(209,213,219,0.6)" }}>
                    Hoàn thành task
                  </p>
                  <div>
                    <label className="text-[10px] mb-1 block" style={{ color: "rgba(209,213,219,0.4)" }}>
                      Chất lượng (1-10)
                    </label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <button key={n} onClick={() => setScore(n)}
                          className="w-7 h-7 rounded text-[10px] font-bold transition-all"
                          style={{
                            background: score === n ? "#10B981" : "rgba(255,255,255,0.05)",
                            color: score === n ? "#fff" : "rgba(209,213,219,0.4)",
                          }}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea value={note} onChange={e => setNote(e.target.value)}
                    placeholder="Ghi chú hoàn thành (tuỳ chọn)..."
                    rows={2}
                    className="w-full rounded-lg border px-3 py-2 text-xs text-white placeholder-gray-500 outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
              )}
            </div>
          )}

          {/* ── BUG NOTES ── */}
          {tab === "bug-notes" && (
            <div className="space-y-4">
              {/* Add bug form */}
              {onAddBugNote && (
                <div className="rounded-lg border p-3 space-y-2"
                  style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                  <p className="text-xs font-semibold" style={{ color: "rgba(209,213,219,0.6)" }}>
                    Báo bug mới
                  </p>
                  <textarea value={bugContent} onChange={e => setBugContent(e.target.value)}
                    placeholder="Mô tả bug..."
                    rows={2}
                    className="w-full rounded border px-3 py-2 text-xs text-white placeholder-gray-500 outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                  <div className="flex items-center gap-2">
                    <select value={bugSeverity} onChange={e => setBugSeverity(e.target.value)}
                      className="rounded border px-2 py-1 text-xs text-white outline-none"
                      style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.15)" }}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    <button onClick={handleAddBug} disabled={addingBug || !bugContent.trim()}
                      className="rounded px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
                      style={{ background: "#EF4444" }}>
                      {addingBug ? "..." : "Báo bug"}
                    </button>
                  </div>
                </div>
              )}

              {/* Bug notes list */}
              {(!task.bugNotes || task.bugNotes.length === 0) ? (
                <p className="text-center py-8 text-xs" style={{ color: "rgba(209,213,219,0.2)" }}>
                  Chưa có bug note nào
                </p>
              ) : (
                <div className="space-y-2">
                  {task.bugNotes.map(note => (
                    <div key={note.id}
                      className="rounded-lg border p-3"
                      style={{
                        borderColor: note.status === "resolved" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)",
                        background: note.status === "resolved" ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)",
                      }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold rounded-full px-1.5 py-0.5"
                            style={{ background: (PRIORITY_COLORS[note.severity] ?? "#94a3b8") + "20", color: PRIORITY_COLORS[note.severity] }}>
                            {note.severity}
                          </span>
                          <span className="text-[10px] font-medium rounded-full px-1.5 py-0.5"
                            style={{
                              background: note.status === "resolved" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                              color: note.status === "resolved" ? "#10B981" : "#f59e0b",
                            }}>
                            {note.status === "resolved" ? "✓ Resolved" : note.status === "acknowledged" ? "Acknowledged" : "Open"}
                          </span>
                        </div>
                        <span className="text-[9px]" style={{ color: "rgba(209,213,219,0.3)" }}>
                          {VI_DATE.format(new Date(note.createdAt))}
                        </span>
                      </div>
                      <p className="text-xs text-gray-200 mb-1.5">{note.content}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                          by {note.author.name}
                        </span>
                        {note.status !== "resolved" && onResolveBugNote && (
                          <button onClick={() => onResolveBugNote(note.id)}
                            className="text-[10px] font-medium rounded px-2 py-0.5"
                            style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>
                            ✓ Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── COMMITS ── */}
          {tab === "commits" && (
            <div>
              {(!task.commits || task.commits.length === 0) ? (
                <p className="text-center py-8 text-xs" style={{ color: "rgba(209,213,219,0.2)" }}>
                  Chưa có commit nào
                </p>
              ) : (
                <div className="space-y-3">
                  {task.commits.map(commit => (
                    <div key={commit.id}
                      className="rounded-lg border p-3"
                      style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-[10px] font-mono rounded px-1.5 py-0.5"
                          style={{ background: "rgba(139,92,246,0.1)", color: "#A78BFA" }}>
                          {commit.sha.slice(0, 7)}
                        </code>
                        <span className="text-[10px] rounded-full px-1.5 py-0.5"
                          style={{ background: commit.mergedToMain ? "rgba(16,185,129,0.15)" : "rgba(99,102,241,0.15)", color: commit.mergedToMain ? "#10B981" : "#818CF8" }}>
                          {commit.mergedToMain ? "✓ Merged" : "Push"}
                        </span>
                        <span className="text-[9px] ml-auto" style={{ color: "rgba(209,213,219,0.3)" }}>
                          {VI_DATE.format(new Date(commit.committedAt))}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-2">{commit.message}</p>
                      <p className="text-[10px] mt-1" style={{ color: "rgba(209,213,219,0.35)" }}>
                        {commit.authorName} · {commit.branch}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── LP AWARDS ── */}
          {tab === "lp" && (
            <div>
              {task.lp > 0 && (
                <div className="rounded-lg border p-4 mb-4 text-center"
                  style={{ borderColor: "rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.05)" }}>
                  <p className="text-2xl font-black" style={{ color: "#A78BFA" }}>⬡{task.lp}</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>LP value của task này</p>
                </div>
              )}
              {(!task.lpAwards || task.lpAwards.length === 0) ? (
                <p className="text-center py-8 text-xs" style={{ color: "rgba(209,213,219,0.2)" }}>
                  Chưa có LP award nào
                </p>
              ) : (
                <div className="space-y-2">
                  {task.lpAwards.map(award => (
                    <div key={award.id}
                      className="rounded-lg border p-3 flex items-center gap-3"
                      style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                      <span className="text-base font-black" style={{ color: "#A78BFA" }}>⬡{award.lpAmount}</span>
                      <div className="flex-1">
                        <p className="text-xs text-white">{award.source}</p>
                        <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                          {VI_DATE.format(new Date(award.createdAt))}
                        </p>
                      </div>
                      <span className="text-[10px] rounded-full px-2 py-0.5 font-medium"
                        style={{
                          background: award.status === "approved" ? "rgba(16,185,129,0.15)" : award.status === "pending" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                          color: award.status === "approved" ? "#10B981" : award.status === "pending" ? "#f59e0b" : "#ef4444",
                        }}>
                        {award.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 flex gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={onClose}
            className="flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
            style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(209,213,219,0.7)" }}>
            Đóng
          </button>
          <button
            onClick={handleTransition}
            disabled={transitioning}
            className="flex-1 rounded-lg py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: next.color }}>
            {transitioning ? "..." : next.label}
          </button>
        </div>
      </div>
    </div>
  );
}
