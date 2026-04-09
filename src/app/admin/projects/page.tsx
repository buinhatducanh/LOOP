"use client";

/**
 * Projects Kanban Admin Page — LOOP Solutions
 * Route: /admin/projects
 * Wire: /api/admin/projects
 *
 * Gaps fixed (2026-04-03):
 * 1. Drag-drop status mutation (PUT /api/admin/projects/:id with status)
 * 2. "Dự án mới" button opens create modal
 * 3. Edit button on each card
 * 4. Delete button on each card
 * 5. useMutation wired via hardcoded query keys
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";

import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { Plus, RefreshCw, Search, GripVertical, Calendar, X, Edit2, Trash2, AlertTriangle } from "lucide-react";

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("vi-VN"); }
  catch { return String(d); }
};

const STATUS_COLS: Record<string, { label: string; color: string; bg: string }> = {
  backlog:      { label: "Backlog",      color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
  epic:          { label: "Epic",          color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  todo:          { label: "Todo",          color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  in_progress:   { label: "Doing",          color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  qa:            { label: "QA",            color: "#818CF8", bg: "rgba(129,140,248,0.1)" },
  done:          { label: "Done",          color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  cancelled:     { label: "Cancelled",    color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

// 5 cột chuẩn cho website design: Backlog → Todo → Doing → QA → Done
// "epic" được giữ trong STATUS_COLS để filter nhưng không hiển thị trên Kanban board
const BOARD_COLS = ["backlog", "todo", "in_progress", "qa", "done"] as const;

type TeamMemberOption = {
  id: string;
  name: string;
  avatar?: string;
};

type Project = {
  id: string;
  name: string;
  orderNumber: string;
  customerName: string;
  status: string;
  progress: number;
  startDate?: string;
  endDate?: string;
  service?: { title: string };
  assigneeId?: string;
  assigneeName?: string;
  priority?: string;
  dueDate?: string;
  epicId?: string;
  description?: string;
  storyPoints?: number;
  tags?: string[];
};

type ProjectFormData = {
  name: string;
  description: string;
  assigneeId: string;
  priority: string;
  status: string;
  dueDate: string;
  startDate: string;
  endDate: string;
};

// ── New/Edit Project Modal ─────────────────────────────────────────────────────

function ProjectModal({
  project,
  onClose,
  onSuccess,
}: {
  project: Project | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!project;
  const [form, setForm] = useState<ProjectFormData>({
    name: project?.name ?? "",
    description: project?.description ?? "",
    assigneeId: project?.assigneeId ?? "",
    priority: project?.priority ?? "medium",
    status: project?.status ?? "backlog",
    dueDate: project?.dueDate ?? "",
    startDate: project?.startDate ?? "",
    endDate: project?.endDate ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Tên dự án là bắt buộc");
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        assigneeId: form.assigneeId || undefined,
        priority: form.priority,
        status: form.status,
        dueDate: form.dueDate || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };
      if (isEdit) {
        await adminApi.put(`/api/admin/projects/${project!.id}`, payload);
      } else {
        await adminApi.post("/api/admin/projects", payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const inp: React.CSSProperties = {
    width: "100%",
    background: DS.bg,
    border: `1px solid ${DS.border}`,
    borderRadius: 10,
    padding: "9px 12px",
    color: DS.text,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: DS.body,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(8px)",
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: DS.bgCard,
            border: `1px solid ${DS.border}`,
            borderRadius: 16,
            padding: 24,
            width: "100%",
            maxWidth: 560,
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18 }}>
              {isEdit ? "Sửa dự án" : "Dự án mới"}
            </h3>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Tên dự án */}
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
                TÊN DỰ ÁN *
              </label>
              <input
                style={inp}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nhập tên dự án"
                required
              />
            </div>

            {/* Mô tả */}
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
                MÔ TẢ
              </label>
              <textarea
                style={{ ...inp, resize: "vertical", minHeight: 80 }}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả dự án..."
              />
            </div>

            {/* Assignee + Priority row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
                  NGƯỜI PHỤ TRÁCH
                </label>
                <select
                  value={form.assigneeId}
                  onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))}
                  style={{ ...inp, cursor: "pointer" }}
                >
                  <option value="">Chưa gán</option>
                  {[
                    { id: "tm_akira", name: "Akira Tanaka" },
                    { id: "tm_ryo", name: "Ryo Yamamoto" },
                    { id: "tm_mei", name: "Mei Linh" },
                    { id: "tm_yuna", name: "Yuna Park" },
                    { id: "tm_kai", name: "Kai Nguyen" },
                    { id: "tm_shin", name: "Shinji Võ" },
                  ].map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
                  ƯU TIÊN
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  style={{ ...inp, cursor: "pointer" }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Status + DueDate row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
                  TRẠNG THÁI
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  style={{ ...inp, cursor: "pointer" }}
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">Todo</option>
                  <option value="in_progress">Doing</option>
                  <option value="qa">QA</option>
                  <option value="done">Done</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
                  HẠN (Ngày)
                </label>
                <input
                  type="date"
                  style={inp}
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Start date + End date */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
                  NGÀY BẮT ĐẦU
                </label>
                <input
                  type="date"
                  style={inp}
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>
                  NGÀY KẾT THÚC
                </label>
                <input
                  type="date"
                  style={inp}
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8,
                padding: "8px 12px",
                color: "#EF4444",
                fontSize: 12,
              }}>
                <AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1, padding: "10px", background: DS.bg,
                  border: `1px solid ${DS.border}`, borderRadius: 10,
                  color: DS.text3, cursor: "pointer", fontSize: 13,
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 1, padding: "10px",
                  background: saving ? DS.text4 : DS.blue,
                  border: "none", borderRadius: 10,
                  color: "#fff", fontWeight: 700,
                  cursor: saving ? "not-allowed" : "pointer", fontSize: 13,
                }}
              >
                {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo dự án"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Project Card ───────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  onEdit,
}: {
  project: Project;
  onEdit: (project: Project) => void;
}) {
  const qc = useQueryClient();

  const delete_ = useMutation({
    mutationFn: async () => {
      await adminApi.delete(`/api/admin/projects/${project.id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "projects"] }),
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Xóa thất bại"); },
  });

  const cfg = STATUS_COLS[project.status] ?? { color: DS.text4, bg: "transparent", label: project.status };

  const handleDelete = () => {
    if (!confirm(`Xóa dự án "${project.name}"?`)) return;
    delete_.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: `0 4px 20px rgba(0,0,0,0.3)` }}
      style={{
        background: DS.bgCard,
        border: `1px solid ${DS.border}`,
        borderRadius: 10,
        padding: "0.75rem",
        cursor: "grab",
        transition: "box-shadow 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ color: DS.text, fontSize: 12, fontWeight: 600, lineHeight: 1.3, flex: 1 }}>
          {project.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(project); }}
            title="Sửa"
            style={{ background: "none", border: "none", cursor: "pointer", color: DS.text4, display: "flex", padding: 2 }}
          >
            <Edit2 size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            title="Xóa"
            style={{ background: "none", border: "none", cursor: "pointer", color: DS.red, display: "flex", padding: 2 }}
          >
            <Trash2 size={11} />
          </button>
          <GripVertical size={12} style={{ color: DS.text5 }} />
        </div>
      </div>
      <div style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono, marginBottom: 8 }}>
        {project.orderNumber}
      </div>
      {project.service?.title && (
        <div style={{ color: DS.text4, fontSize: 10, marginBottom: 6 }}>{project.service.title}</div>
      )}
      {project.customerName && (
        <div style={{ color: DS.text3, fontSize: 11, marginBottom: 6 }}>{project.customerName}</div>
      )}
      {project.assigneeName && (
        <div style={{ color: DS.purple, fontSize: 10, marginBottom: 6 }}>👤 {project.assigneeName}</div>
      )}
      {project.priority && (
        <div style={{
          display: "inline-block",
          marginBottom: 6,
          padding: "1px 5px",
          borderRadius: 4,
          fontSize: 9,
          fontFamily: DS.mono,
          fontWeight: 700,
          color: project.priority === "urgent" ? "#EF4444"
            : project.priority === "high" ? "#F59E0B"
            : project.priority === "medium" ? "#3B82F6"
            : DS.text4,
          background: project.priority === "urgent" ? "rgba(239,68,68,0.1)"
            : project.priority === "high" ? "rgba(245,158,11,0.1)"
            : project.priority === "medium" ? "rgba(59,130,246,0.1)"
            : "rgba(148,163,184,0.1)",
        }}>
          {project.priority.toUpperCase()}
        </div>
      )}
      {/* Progress bar */}
      <div style={{ height: 3, background: DS.bg, borderRadius: 2, marginBottom: 6, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${project.progress ?? 0}%`, background: cfg.color, borderRadius: 2 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{
          background: cfg.bg, color: cfg.color, padding: "2px 6px",
          borderRadius: 9999, fontSize: 9, fontFamily: DS.mono, fontWeight: 700,
        }}>
          {cfg.label}
        </span>
        {(project.endDate || project.dueDate) && (
          <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, display: "flex", alignItems: "center", gap: 2 }}>
            <Calendar size={9} /> {fmtDate(project.dueDate ?? project.endDate)}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Kanban Column ─────────────────────────────────────────────────────────────

function Column({
  status,
  projects,
  onEdit,
}: {
  status: string;
  projects: Project[];
  onEdit: (p: Project) => void;
}) {
  const cfg = STATUS_COLS[status] ?? { label: status, color: DS.text4, bg: "transparent" };
  const filtered = projects.filter(p => p.status === status);

  return (
    <div style={{ flex: 1, minWidth: 200, display: "flex", flexDirection: "column" }}>
      {/* Column header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", padding: "0 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }} />
          <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>{cfg.label}</span>
        </div>
        <span style={{
          background: `${cfg.color}20`, color: cfg.color, padding: "1px 6px",
          borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 700,
        }}>
          {filtered.length}
        </span>
      </div>
      {/* Cards */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem", minHeight: 200 }}>
        {filtered.map(p => <ProjectCard key={p.id} project={p} onEdit={onEdit} />)}
        {filtered.length === 0 && (
          <div style={{ border: `1px dashed ${DS.border}`, borderRadius: 8, padding: "1rem", textAlign: "center", color: DS.text5, fontSize: 11 }}>
            Trống
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [page] = useState(1);
  const [search, setSearch] = useState("");
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const qc = useQueryClient();

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkDelete = useMutation({
    mutationFn: async () => {
      await Promise.all([...selectedIds].map(id => adminApi.delete(`/admin/projects/${id}`)));
    },
    onSuccess: () => {
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ["admin", "projects"] });
    },
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Xóa thất bại"); },
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: (["admin", "projects", { page, limit: 100, ...(search ? { search } : {}) }] as const),
    queryFn: () =>
      adminApi.get<{ data: Project[]; pagination: { total: number } }>("/api/admin/projects", {
        params: { page, limit: 100, ...(search ? { search } : {}) },
      }),
  });

  // ── Status drag-drop mutation ───────────────────────────────────────────────
  const statusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await adminApi.put(`/api/admin/projects/${id}`, { status });
    },
    onMutate: async ({ id, status }) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: ["admin", "projects"] });
      const prev = qc.getQueryData<{ data: Project[] }>(["admin", "projects"]);
      qc.setQueryData<{ data: Project[] }>(["admin", "projects"], (old: { data: Project[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((p: Project) => p.id === id ? { ...p, status } : p),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["admin", "projects"], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin", "projects"] });
    },
  });

  // Drag-drop handler
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>, targetStatus: string) => {
    const projectId = e.dataTransfer.getData("projectId");
    if (!projectId) return;
    const project = (data?.data ?? []).find((p: Project) => p.id === projectId);
    if (!project || project.status === targetStatus) return;
    statusMut.mutate({ id: projectId, status: targetStatus });
  };

  const _handleDragStart = (e: React.DragEvent<HTMLDivElement>, projectId: string) => {
    e.dataTransfer.setData("projectId", projectId);
    e.dataTransfer.effectAllowed = "move";
  };

  const projects = data?.data ?? [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Kanban Dự án
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {projects.length} dự án · Kéo thả để cập nhật trạng thái
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
            <input
              type="text"
              placeholder="Tìm dự án..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "6px 12px 6px 32px", color: DS.text, fontSize: 12, outline: "none", width: 180, fontFamily: DS.body }}
            />
          </div>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["admin", "projects"] })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Làm mới
          </button>
          <button
            onClick={() => setEditProject(null)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: DS.blue, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: DS.mono }}
          >
            <Plus size={13} /> Dự án mới
          </button>
        </div>
      </div>

      {/* Board */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "1rem" }}>
          {BOARD_COLS.map(col => (
            <div
              key={col}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
              onDrop={(e) => handleDragEnd(e, col)}
            >
              <Column status={col} projects={projects} onEdit={setEditProject} />
            </div>
          ))}
        </div>
      )}

      {/* Project count by status */}
      {!isLoading && (
        <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {Object.entries(STATUS_COLS).map(([key, cfg]) => {
            const count = projects.filter((p: Project) => p.status === key).length;
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "4px 12px" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color }} />
                <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono }}>{cfg.label}</span>
                <span style={{ color: cfg.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit modal */}
      <AnimatePresence>
        {editProject !== null && (
          <ProjectModal
            project={editProject}
            onClose={() => setEditProject(null)}
            onSuccess={() => qc.invalidateQueries({ queryKey: ["admin", "projects"] })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
