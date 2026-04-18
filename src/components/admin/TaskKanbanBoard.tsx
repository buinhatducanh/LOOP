"use client";

/**
 * TaskKanbanBoard — task-level project Kanban board per Order
 * 5 columns: Backlog → Todo → In Progress → In Review → Done
 * Features: Drag-drop, transitions, filters, due dates, overdue badge,
 * bulk create, WIP limit warnings.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Plus, GitBranch, ExternalLink, X,
  CheckCircle2, AlertCircle, Clock, Zap,
  Edit2, Trash2, Calendar, AlertTriangle,
  Layers,
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
  dueDate?: string;
  createdAt: string;
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
  branchName?: string;
  githubLink?: string;
  column?: KanbanColumn;
  dueDate?: string;
}

// ── Column config ─────────────────────────────────────────────────────────────

const COLUMNS: { id: KanbanColumn; label: string; color: string; wipLimit?: number }[] = [
  { id: "backlog", label: "Backlog", color: "#94A3B8" },
  { id: "todo", label: "Cần làm", color: "#4F7DF3", wipLimit: 10 },
  { id: "in_progress", label: "Đang làm", color: "#F59E0B", wipLimit: 5 },
  { id: "in_review", label: "Review", color: "#8B5CF6", wipLimit: 5 },
  { id: "done", label: "Hoàn thành", color: "#22C55E" },
];

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#EF4444",
  high: "#F59E0B",
  medium: "#4F7DF3",
  low: "#94A3B8",
};

const NEXT_COLUMNS: Record<KanbanColumn, KanbanColumn[]> = {
  backlog: ["todo"],
  todo: ["backlog", "in_progress"],
  in_progress: ["backlog", "in_review"],
  in_review: ["in_progress", "done"],
  done: ["in_progress"],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function avatar(name?: string): string {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function priorityIcon(p: string) {
  if (p === "urgent") return <AlertCircle size={10} style={{ color: PRIORITY_COLORS.urgent }} />;
  if (p === "high") return <Zap size={10} style={{ color: PRIORITY_COLORS.high }} />;
  if (p === "medium") return <Clock size={10} style={{ color: PRIORITY_COLORS.medium }} />;
  return <CheckCircle2 size={10} style={{ color: PRIORITY_COLORS.low }} />;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function isOverdue(dueDateStr?: string, column?: KanbanColumn): boolean {
  if (!dueDateStr || column === "done") return false;
  return new Date(dueDateStr) < new Date();
}

function daysUntilDue(dueDateStr?: string): number | null {
  if (!dueDateStr) return null;
  const due = new Date(dueDateStr);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── TaskCard ───────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onTransition,
  onEdit,
  onDelete,
  onDragStart,
}: {
  task: TaskKanban;
  onTransition: (id: string, col: KanbanColumn) => void;
  onEdit: (task: TaskKanban) => void;
  onDelete: (id: string) => void;
  onDragStart: (id: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const overdue = isOverdue(task.dueDate, task.column);
  const daysLeft = daysUntilDue(task.dueDate);
  const dueWarning = daysLeft !== null && daysLeft <= 2 && daysLeft >= 0 && task.column !== "done";

  return (
    <div
      className="relative rounded-lg p-3 mb-2 cursor-pointer group transition-all duration-200"
      style={{
        backgroundColor: overdue ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
        border: overdue ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(255,255,255,0.06)",
      }}
      draggable
      onDragStart={e => { e.dataTransfer.setData("taskId", task.id); onDragStart(task.id); }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.backgroundColor = overdue ? "rgba(239,68,68,0.13)" : "rgba(255,255,255,0.08)";
        el.style.borderColor = overdue ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.12)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.backgroundColor = overdue ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)";
        el.style.borderColor = overdue ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(255,255,255,0.06)";
      }}
      onClick={e => { if (!(e.target as HTMLElement).closest('[data-no-menu]')) setShowMenu(v => !v); }}
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
        <div className="flex items-center gap-1.5">
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
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-white mb-2 leading-snug">
        {task.title}
      </p>

      {/* Due date + Overdue badge */}
      {task.dueDate && (
        <div className="mb-2">
          <span
            className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full"
            style={{
              backgroundColor: overdue
                ? "rgba(239,68,68,0.15)"
                : dueWarning
                  ? "rgba(245,158,11,0.15)"
                  : "rgba(255,255,255,0.06)",
              color: overdue ? "#EF4444" : dueWarning ? "#F59E0B" : "#94A3B8",
            }}
          >
            {overdue ? <AlertTriangle size={10} /> : <Calendar size={10} />}
            {overdue ? "Quá hạn" : `${formatDate(task.dueDate)}`}
          </span>
        </div>
      )}

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
          <button
            data-no-menu
            onClick={e => { e.stopPropagation(); onEdit(task); }}
            className="p-1 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
            style={{ color: "#94A3B8" }}
            title="Sửa task"
          >
            <Edit2 size={11} />
          </button>
          <button
            data-no-menu
            onClick={e => { e.stopPropagation(); onDelete(task.id); }}
            className="p-1 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
            style={{ color: "#EF4444" }}
            title="Xóa task"
          >
            <Trash2 size={11} />
          </button>
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
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colCfg.color }} />
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

// ── TaskFormModal (shared by Create + Bulk) ──────────────────────────────────

interface TaskFormModalProps {
  mode: "create" | "edit";
  initialTask?: TaskKanban;
  orderId: string;
  members: { id: string; name: string; projectRoleKey: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

function TaskFormModal({ mode, initialTask, orderId, members, onClose, onSuccess }: TaskFormModalProps) {
  const [form, setForm] = useState<CreateTaskData>({
    title: initialTask?.title ?? "",
    description: initialTask?.description ?? "",
    priority: initialTask?.priority ?? "medium",
    lp: initialTask?.lp ?? 0,
    assigneeId: initialTask?.assigneeId ?? "",
    qaId: initialTask?.qaId ?? "",
    branchName: initialTask?.branchName ?? "",
    githubLink: initialTask?.githubLink ?? "",
    column: initialTask?.column ?? "backlog",
    dueDate: initialTask?.dueDate ? initialTask.dueDate.slice(0, 10) : "",
  });

  const filteredDevs = members.filter(m => ["dev", "designer"].includes(m.projectRoleKey));
  const filteredQa = members.filter(m => m.projectRoleKey === "qa");

  const create = useMutation({
    mutationFn: async (data: CreateTaskData) => {
      const payload = { ...data, orderId };
      const res = await adminApi.post(`/admin/task-kanban`, payload);
      return (res as { data: TaskKanban }).data;
    },
    onSuccess: () => { onSuccess(); onClose(); },
  });

  const update = useMutation({
    mutationFn: async (data: Partial<CreateTaskData>) => {
      const payload: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        priority: data.priority,
        lp: data.lp,
      };
      if (data.assigneeId) payload.assigneeId = data.assigneeId;
      if (data.qaId) payload.qaId = data.qaId;
      if (data.branchName) payload.branchName = data.branchName;
      if (data.githubLink) payload.githubLink = data.githubLink;
      if (data.dueDate !== undefined) payload.dueDate = data.dueDate || null;
      const res = await adminApi.patch(`/admin/task-kanban/${initialTask!.id}`, payload);
      return (res as { data: TaskKanban }).data;
    },
    onSuccess: () => { onSuccess(); onClose(); },
    onError: () => alert("Cập nhật thất bại"),
  });

  const handleSubmit = () => {
    const payload = {
      ...form,
      assigneeId: form.assigneeId || undefined,
      qaId: form.qaId || undefined,
      branchName: form.branchName || undefined,
      githubLink: form.githubLink || undefined,
    };
    if (mode === "create") {
      create.mutate(payload);
    } else {
      update.mutate(payload);
    }
  };

  const isPending = create.isPending || update.isPending;

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
        className="rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: "#0F172A", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white">
            {mode === "create" ? "Tạo Task mới" : "Sửa Task"}
          </h3>
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

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Ngày hết hạn
            </label>
            <input
              type="date"
              value={form.dueDate ?? ""}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value || undefined }))}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)" }}
            />
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

          <div>
            <label className="block text-sm text-gray-400 mb-1">Branch</label>
            <input
              value={form.branchName ?? ""}
              onChange={e => setForm(f => ({ ...f, branchName: e.target.value || undefined }))}
              placeholder="VD: feature/homepage"
              className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
              style={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">GitHub Link</label>
            <input
              value={form.githubLink ?? ""}
              onChange={e => setForm(f => ({ ...f, githubLink: e.target.value || undefined }))}
              placeholder="VD: https://github.com/..."
              className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
              style={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!form.title || isPending}
          className="mt-5 w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: GRD.primary }}
        >
          {isPending ? "Đang lưu..." : mode === "create" ? "Tạo Task" : "Lưu thay đổi"}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── BulkCreateModal ────────────────────────────────────────────────────────────

interface BulkTaskRow {
  title: string;
  priority: "low" | "medium" | "high" | "urgent";
  lp: number;
  assigneeId?: string;
  dueDate?: string;
}

interface BulkCreateModalProps {
  orderId: string;
  members: { id: string; name: string; projectRoleKey: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

const DEFAULT_ROW: BulkTaskRow = { title: "", priority: "medium", lp: 0, assigneeId: undefined, dueDate: undefined };

function BulkCreateModal({ orderId, members, onClose, onSuccess }: BulkCreateModalProps) {
  const [rows, setRows] = useState<BulkTaskRow[]>([{ ...DEFAULT_ROW }]);
  const filteredDevs = members.filter(m => ["dev", "designer"].includes(m.projectRoleKey));

  const create = useMutation({
    mutationFn: async () => {
      const validRows = rows.filter(r => r.title.trim());
      await Promise.all(
        validRows.map(row =>
          adminApi.post(`/admin/task-kanban`, {
            ...row,
            orderId,
            assigneeId: row.assigneeId || undefined,
          }),
        ),
      );
    },
    onSuccess: () => { onSuccess(); onClose(); },
  });

  const addRow = () => setRows(r => [...r, { ...DEFAULT_ROW }]);
  const removeRow = (i: number) => setRows(r => r.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof BulkTaskRow, value: string | number) =>
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  const validCount = rows.filter(r => r.title.trim()).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        style={{ backgroundColor: "#0F172A", border: "1px solid rgba(255,255,255,0.1)" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-semibold text-white">Tạo nhiều Task</h3>
            <p className="text-xs mt-1" style={{ color: DS.text4 }}>{validCount} task sẽ được tạo</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={addRow}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
              style={{ backgroundColor: "rgba(107,61,245,0.3)", border: "1px solid rgba(107,61,245,0.5)" }}
            >
              + Thêm dòng
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
              <X size={18} color="#94A3B8" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {rows.map((row, i) => (
            <div
              key={i}
              className="rounded-lg p-3 flex gap-3 items-end"
              style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">
                  {i + 1}. Tiêu đề
                </label>
                <input
                  value={row.title}
                  onChange={e => updateRow(i, "title", e.target.value)}
                  placeholder="VD: Thiết kế trang chủ"
                  className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
                  style={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
              <div className="w-24">
                <label className="block text-xs text-gray-400 mb-1">Ưu tiên</label>
                <select
                  value={row.priority}
                  onChange={e => updateRow(i, "priority", e.target.value)}
                  className="w-full rounded-lg px-2 py-2 text-xs text-white outline-none"
                  style={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="w-20">
                <label className="block text-xs text-gray-400 mb-1">LP</label>
                <input
                  type="number"
                  value={row.lp}
                  onChange={e => updateRow(i, "lp", parseInt(e.target.value) || 0)}
                  className="w-full rounded-lg px-2 py-2 text-xs text-white outline-none"
                  style={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
              <div className="w-28">
                <label className="block text-xs text-gray-400 mb-1">Dev</label>
                <select
                  value={row.assigneeId ?? ""}
                  onChange={e => updateRow(i, "assigneeId", e.target.value)}
                  className="w-full rounded-lg px-2 py-2 text-xs text-white outline-none"
                  style={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <option value="">—</option>
                  {filteredDevs.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <label className="block text-xs text-gray-400 mb-1">Hạn</label>
                <input
                  type="date"
                  value={row.dueDate ?? ""}
                  onChange={e => updateRow(i, "dueDate", e.target.value)}
                  className="w-full rounded-lg px-2 py-2 text-xs text-white outline-none"
                  style={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>
              {rows.length > 1 && (
                <button
                  onClick={() => removeRow(i)}
                  className="p-2 rounded hover:bg-white/10 transition-colors"
                  style={{ color: "#EF4444" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => create.mutate()}
          disabled={validCount === 0 || create.isPending}
          className="mt-5 w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: GRD.primary }}
        >
          {create.isPending ? "Đang tạo..." : `Tạo ${validCount} Task`}
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

  // FIX: send "column" not "toColumn" to match backend expectation
  const transition = useMutation({
    mutationFn: ({ id, column }: { id: string; column: KanbanColumn }) =>
      adminApi.post(`/admin/task-kanban/${id}/transition`, { column }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-kanban", orderId] }),
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Chuyển cột thất bại";
      alert(msg);
    },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<TaskKanban | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [filterDev, setFilterDev] = useState<string>("");
  const [filterQa, setFilterQa] = useState<string>("");

  const deleteTask = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/admin/task-kanban/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-kanban", orderId] }),
  });

  const handleEdit = (task: TaskKanban) => setShowEdit(task);
  const handleDelete = (id: string) => {
    if (confirm("Xóa task này?")) deleteTask.mutate(id);
  };
  const handleDragStart = (id: string) => setDraggingId(id);
  const handleDragEnd = () => setDraggingId(null);

  const handleDrop = (e: React.DragEvent, column: KanbanColumn) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) transition.mutate({ id: taskId, column });
    setDraggingId(null);
  };

  const filteredTasks = tasks.filter(t => {
    if (filterPriority && t.priority !== filterPriority) return false;
    if (filterDev && t.assigneeId !== filterDev) return false;
    if (filterQa && t.qaId !== filterQa) return false;
    return true;
  });

  const handleTransition = (id: string, toColumn: KanbanColumn) => {
    transition.mutate({ id, column: toColumn });
  };

  const handleSuccess = () => {
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

  const allDevs = members.filter(m => ["dev", "designer"].includes(m.projectRoleKey));
  const allQa = members.filter(m => m.projectRoleKey === "qa");
  const hasFilter = filterPriority || filterDev || filterQa;

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-xs font-mono" style={{ color: DS.text4 }}>Lọc:</span>
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="rounded px-2 py-1 text-xs text-white outline-none"
          style={{ backgroundColor: DS.bgCard, border: "1px solid " + DS.border }}
        >
          <option value="">Tất cả ưu tiên</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={filterDev}
          onChange={e => setFilterDev(e.target.value)}
          className="rounded px-2 py-1 text-xs text-white outline-none"
          style={{ backgroundColor: DS.bgCard, border: "1px solid " + DS.border }}
        >
          <option value="">Tất cả Dev</option>
          {allDevs.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select
          value={filterQa}
          onChange={e => setFilterQa(e.target.value)}
          className="rounded px-2 py-1 text-xs text-white outline-none"
          style={{ backgroundColor: DS.bgCard, border: "1px solid " + DS.border }}
        >
          <option value="">Tất cả QA</option>
          {allQa.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        {hasFilter && (
          <button
            onClick={() => { setFilterPriority(""); setFilterDev(""); setFilterQa(""); }}
            className="text-xs px-2 py-1 rounded"
            style={{ backgroundColor: DS.red + "20", color: DS.red, border: "1px solid " + DS.red + "40" }}
          >
            Clear
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowBulkCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
            style={{ backgroundColor: "rgba(107,61,245,0.2)", border: "1px solid rgba(107,61,245,0.4)", color: "#A78BFA" }}
          >
            <Layers size={13} />
            Tạo nhiều Task
          </button>
        </div>
      </div>

      <div className={`flex gap-4 overflow-x-auto pb-4 ${className}`}>
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => t.column === col.id);
          const isBacklog = col.id === "backlog";
          const overWip = col.wipLimit !== undefined && colTasks.length > col.wipLimit;

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
                    style={{
                      backgroundColor: overWip ? "rgba(239,68,68,0.2)" : `${col.color}22`,
                      color: overWip ? "#EF4444" : col.color,
                    }}
                  >
                    {colTasks.length}{col.wipLimit ? `/${col.wipLimit}` : ""}
                  </span>
                  {overWip && (
                    <AlertTriangle size={12} style={{ color: "#EF4444" }} />
                  )}
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
              <div
                className="flex-1 overflow-y-auto px-3 py-3"
                style={{ maxHeight: "calc(100vh - 320px)" }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, col.id)}
                onDragEnd={handleDragEnd}
              >
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
                      <TaskCard
                        task={task}
                        onTransition={handleTransition}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDragStart={handleDragStart}
                      />
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
          <TaskFormModal
            mode="create"
            orderId={orderId}
            members={members}
            onClose={() => setShowCreate(false)}
            onSuccess={handleSuccess}
          />
        )}
        {showBulkCreate && (
          <BulkCreateModal
            orderId={orderId}
            members={members}
            onClose={() => setShowBulkCreate(false)}
            onSuccess={handleSuccess}
          />
        )}
        {showEdit && (
          <TaskFormModal
            mode="edit"
            orderId={orderId}
            initialTask={showEdit}
            members={members}
            onClose={() => setShowEdit(null)}
            onSuccess={handleSuccess}
          />
        )}
      </AnimatePresence>
    </>
  );
}
