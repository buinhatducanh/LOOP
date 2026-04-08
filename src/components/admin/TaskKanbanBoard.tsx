"use client";

/**
 * TaskKanbanBoard — task-level project Kanban board per Order
 * 5 columns: Backlog → Todo → In Progress → In Review → Done
 * Used by PM to manage tasks within a project (Order).
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Plus, GitBranch, ExternalLink, X,
  CheckCircle2, AlertCircle, Clock, Zap,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type KanbanColumn = "backlog" | "todo" | "in_progress" | "in_review" | "done";

interface TaskKanban {
  id: string;
  orderId: string;
  column: KanbanColumn;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  lp: number;
  branchName?: string;
  githubLink?: string;
  assigneeId?: string;
  qaId?: string;
  completedAt?: string;
  createdAt: string;
  // joined relation data
  assignee?: { name: string; avatar?: string };
  qa?: { name: string; avatar?: string };
}

interface CreateTaskData {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  lp?: number;
  assigneeId?: string;
  qaId?: string;
  column?: KanbanColumn;
}

// ── Column config ─────────────────────────────────────────────────────────────

const COLUMNS: { id: KanbanColumn; label: string; color: string }[] = [
  { id: "backlog",     label: "Backlog",       color: "#94A3B8" },
  { id: "todo",        label: "Cần làm",      color: "#4F7DF3" },
  { id: "in_progress", label: "Đang làm",     color: "#F59E0B" },
  { id: "in_review",   label: "Review",        color: "#8B5CF6" },
  { id: "done",        label: "Hoàn thành",   color: "#22C55E" },
];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#EF4444",
  high:   "#F59E0B",
  medium: "#4F7DF3",
  low:    "#94A3B8",
};

const NEXT_COLUMNS: Record<KanbanColumn, KanbanColumn[]> = {
  backlog:     ["todo"],
  todo:        ["backlog", "in_progress"],
  in_progress: ["backlog", "in_review"],
  in_review:   ["in_progress", "done"],
  done:        ["in_progress"],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function avatar(name?: string): string {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function priorityIcon(p: string) {
  if (p === "urgent") return <AlertCircle size={10} style={{ color: PRIORITY_COLORS.urgent }} />;
  if (p === "high")   return <Zap size={10} style={{ color: PRIORITY_COLORS.high }} />;
  if (p === "medium") return <Clock size={10} style={{ color: PRIORITY_COLORS.medium }} />;
  return <CheckCircle2 size={10} style={{ color: PRIORITY_COLORS.low }} />;
}

// ── TaskCard ───────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onTransition,
}: {
  task: TaskKanban;
  onTransition: (id: string, col: KanbanColumn) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className="relative rounded-lg p-3 mb-2 cursor-pointer group transition-all duration-200"
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(255,255,255,0.08)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(255,255,255,0.04)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)";
      }}
      onClick={() => setShowMenu(v => !v)}
    >
      {/* Priority + LP row */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          {priorityIcon(task.priority)}
          <span
            className="text-xs font-medium px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: `${PRIORITY_COLORS[task.priority]}22`,
              color: PRIORITY_COLORS[task.priority],
            }}
          >
            {task.priority}
          </span>
        </div>
        {task.lp > 0 && (
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: "rgba(230,199,95,0.15)",
              color: "#E6C75F",
            }}
          >
            {task.lp.toLocaleString()} LP
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-white mb-2 leading-snug">
        {task.title}
      </p>

      {/* Bottom row: assignees + links */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {task.assignee && (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: GRD.primary, color: "#fff" }}
              title={`Dev: ${task.assignee.name}`}
            >
              {avatar(task.assignee.name)}
            </div>
          )}
          {task.qa && (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border"
              style={{ backgroundColor: "transparent", borderColor: PRIORITY_COLORS.high, color: PRIORITY_COLORS.high }}
              title={`QA: ${task.qa.name}`}
            >
              QA
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {task.githubLink && (
            <a
              href={task.githubLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="p-1 rounded opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
            >
              <ExternalLink size={12} style={{ color: DS.cosmicCyan }} />
            </a>
          )}
          {task.branchName && (
            <div
              className="flex items-center gap-0.5 text-xs opacity-0 group-hover:opacity-50 transition-opacity"
              style={{ color: "#94A3B8" }}
            >
              <GitBranch size={10} />
              <span className="font-mono text-[10px] max-w-[60px] truncate">{task.branchName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Move-to menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute left-0 right-0 top-full mt-1 rounded-lg z-20 shadow-xl overflow-hidden"
            style={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-1">
              <div className="text-xs text-gray-400 px-2 py-1">Chuyển sang:</div>
              {NEXT_COLUMNS[task.column].map(col => {
                const colCfg = COLUMNS.find(c => c.id === col)!;
                return (
                  <button
                    key={col}
                    onClick={() => {
                      onTransition(task.id, col);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm rounded flex items-center gap-2 transition-colors"
                    style={{ color: colCfg.color }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: colCfg.color }}
                    />
                    {colCfg.label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── CreateTaskModal ───────────────────────────────────────────────────────────

function CreateTaskModal({
  orderId,
  members,
  onClose,
  onCreated,
}: {
  orderId: string;
  members: { id: string; name: string; projectRoleKey: string }[];
  onClose: () => void;
  onCreated: (task: TaskKanban) => void;
}) {
  const [form, setForm] = useState<CreateTaskData>({ title: "", priority: "medium", column: "backlog" });
  const create = useMutation({
    mutationFn: async (data: CreateTaskData): Promise<TaskKanban> => {
      const res = await adminApi.post(`/admin/task-kanban`, { ...data, orderId });
      return (res as { data: TaskKanban }).data;
    },
    onSuccess: (task: TaskKanban) => {
      onCreated(task);
      onClose();
    },
  });

  const devs = members.filter(m => ["dev", "qa", "designer"].includes(m.projectRoleKey));
  const filteredDevs = members.filter(m => ["dev", "designer"].includes(m.projectRoleKey));
  const filteredQa = members.filter(m => m.projectRoleKey === "qa");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-xl p-6 w-full max-w-md"
        style={{ backgroundColor: "#0F172A", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white">Tạo Task mới</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X size={18} color="#94A3B8" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Tiêu đề *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="VD: Thiết kế trang chủ"
              className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
              style={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Mô tả</label>
            <textarea
              value={form.description ?? ""}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Chi tiết task..."
              rows={3}
              className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none resize-none"
              style={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ưu tiên</label>
              <select
                value={form.priority ?? "medium"}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as CreateTaskData["priority"] }))}
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                style={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">LP</label>
              <input
                type="number"
                value={form.lp ?? 0}
                onChange={e => setForm(f => ({ ...f, lp: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                style={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Dev</label>
              <select
                value={form.assigneeId ?? ""}
                onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value || undefined }))}
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                style={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <option value="">Chưa gán</option>
                {filteredDevs.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">QA</label>
              <select
                value={form.qaId ?? ""}
                onChange={e => setForm(f => ({ ...f, qaId: e.target.value || undefined }))}
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                style={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <option value="">Chưa gán</option>
                {filteredQa.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={() => form.title && create.mutate(form)}
          disabled={!form.title || create.isPending}
          className="mt-5 w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: GRD.primary }}
        >
          {create.isPending ? "Đang tạo..." : "Tạo Task"}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Main Board ────────────────────────────────────────────────────────────────

interface TaskKanbanBoardProps {
  orderId: string;
  members?: { id: string; name: string; projectRoleKey: string }[];
  className?: string;
}

export function TaskKanbanBoard({ orderId, members = [], className = "" }: TaskKanbanBoardProps) {
  const qc = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<TaskKanban[]>({
    queryKey: ["task-kanban", orderId],
    queryFn: () => adminApi.get(`/admin/task-kanban?orderId=${orderId}`).then((r: unknown) => (r as { data: TaskKanban[] }).data),
  });

  const transition = useMutation({
    mutationFn: ({ id, column }: { id: string; column: KanbanColumn }) =>
      adminApi.post(`/admin/task-kanban/${id}/transition`, { toColumn: column }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-kanban", orderId] }),
  });

  const [showCreate, setShowCreate] = useState(false);

  const handleTransition = (id: string, toColumn: KanbanColumn) => {
    transition.mutate({ id, column: toColumn });
  };

  const handleCreated = (task: TaskKanban) => {
    qc.invalidateQueries({ queryKey: ["task-kanban", orderId] });
  };

  if (isLoading) {
    return (
      <div className={`flex gap-4 overflow-x-auto pb-4 ${className}`}>
        {COLUMNS.map(col => (
          <div
            key={col.id}
            className="flex-shrink-0 w-72 rounded-xl p-4 animate-pulse"
            style={{ backgroundColor: "rgba(15,23,42,0.6)", minHeight: 400 }}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className={`flex gap-4 overflow-x-auto pb-4 ${className}`}>
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.column === col.id);
          const isBacklog = col.id === "backlog";

          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-72 flex flex-col rounded-xl overflow-hidden"
              style={{ backgroundColor: "rgba(15,23,42,0.6)", minHeight: 400 }}
            >
              {/* Column header */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: `2px solid ${col.color}` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: col.color }}
                  />
                  <span className="text-sm font-semibold text-white">{col.label}</span>
                  <span
                    className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${col.color}22`, color: col.color }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                {isBacklog && (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="p-1 rounded transition-colors"
                    style={{ color: col.color }}
                    title="Tạo task"
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <Plus size={16} />
                  </button>
                )}
              </div>

              {/* Task list */}
              <div className="flex-1 overflow-y-auto px-3 py-3" style={{ maxHeight: "calc(100vh - 320px)" }}>
                <AnimatePresence>
                  {colTasks.map(task => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <TaskCard task={task} onTransition={handleTransition} />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {colTasks.length === 0 && (
                  <div className="text-center py-8 text-sm" style={{ color: "#475569" }}>
                    Chưa có task
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateTaskModal
            orderId={orderId}
            members={members}
            onClose={() => setShowCreate(false)}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>
    </>
  );
}
