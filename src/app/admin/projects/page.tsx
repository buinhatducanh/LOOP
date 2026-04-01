"use client";

/**
 * Projects Kanban Admin Page — LOOP Solutions
 * Route: /admin/projects
 * Wire: /api/admin/projects
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { FolderKanban, Plus, RefreshCw, Search, GripVertical, Calendar } from "lucide-react";

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("vi-VN"); }
  catch { return String(d); }
};

const STATUS_COLS: Record<string, { label: string; color: string; bg: string }> = {
  backlog:      { label: "Backlog", color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
  epic:        { label: "Epic", color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  in_progress: { label: "In Progress", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  review:      { label: "Review", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  done:        { label: "Done", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  cancelled:   { label: "Cancelled", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

const BOARD_COLS = ["backlog", "epic", "in_progress", "review", "done"] as const;

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
};

function ProjectCard({ project }: { project: Project }) {
  const cfg = STATUS_COLS[project.status] ?? { color: DS.text4, bg: "transparent", label: project.status };
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
        <GripVertical size={12} style={{ color: DS.text5, flexShrink: 0, marginLeft: 6 }} />
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
      {/* Progress bar */}
      <div style={{ height: 3, background: DS.bg, borderRadius: 2, marginBottom: 6, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${project.progress ?? 0}%`, background: cfg.color, borderRadius: 2 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ background: cfg.bg, color: cfg.color, padding: "2px 6px", borderRadius: 9999, fontSize: 9, fontFamily: DS.mono, fontWeight: 700 }}>
          {cfg.label}
        </span>
        {project.endDate && (
          <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, display: "flex", alignItems: "center", gap: 2 }}>
            <Calendar size={9} /> {fmtDate(project.endDate)}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function Column({ status, projects }: { status: string; projects: Project[] }) {
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
        <span style={{ background: `${cfg.color}20`, color: cfg.color, padding: "1px 6px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>
          {filtered.length}
        </span>
      </div>
      {/* Cards */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem", minHeight: 200 }}>
        {filtered.map(p => <ProjectCard key={p.id} project={p} />)}
        {filtered.length === 0 && (
          <div style={{ border: `1px dashed ${DS.border}`, borderRadius: 8, padding: "1rem", textAlign: "center", color: DS.text5, fontSize: 11 }}>
            Trống
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [page] = useState(1);
  const [search, setSearch] = useState("");
  const qc = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "projects", page, search],
    queryFn: () =>
      adminApi.get<{ data: Project[]; pagination: { total: number } }>("/api/admin/projects", {
        params: { page, limit: 100, ...(search ? { search } : {}) },
      }),
  });

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
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: DS.blue, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: DS.mono }}>
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
            <Column key={col} status={col} projects={projects} />
          ))}
        </div>
      )}

      {/* Project count by status */}
      {!isLoading && (
        <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {Object.entries(STATUS_COLS).map(([key, cfg]) => {
            const count = projects.filter(p => p.status === key).length;
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
    </div>
  );
}
