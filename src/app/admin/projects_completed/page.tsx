"use client";

/**
 * Completed Projects Admin Page — LOOP Solutions
 * Route: /admin/projects_completed
 * Wire: /api/admin/projects (filter status = done)
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { FolderCheck, RefreshCw, Search, CheckCircle2, Calendar } from "lucide-react";

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("vi-VN"); }
  catch { return String(d); }
};

const fmtB = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
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
  totalValue?: number;
  service?: { title: string };
};

export default function ProjectsCompletedPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "projects", "completed", search],
    queryFn: () =>
      adminApi.get<{ data: Project[]; pagination: { total: number } }>("/api/admin/projects", {
        params: { limit: 100, status: "done", ...(search ? { search } : {}) },
      }),
  });

  const projects = data?.data ?? [];

  const totalValue = projects.reduce((s, p) => s + (p.totalValue ?? 0), 0);
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + (p.progress ?? 0), 0) / projects.length)
    : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Dự án hoàn thành
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {projects.length} dự án done · from /api/admin/projects
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
            onClick={() => qc.invalidateQueries({ queryKey: ["admin", "projects", "completed"] })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>Dự án hoàn thành</span>
            <span style={{ color: DS.green, background: `${DS.green}15`, borderRadius: 8, padding: "4px", display: "flex" }}>
              <FolderCheck size={16} />
            </span>
          </div>
          <div style={{ color: DS.green, fontSize: "1.75rem", fontWeight: 700, fontFamily: DS.heading }}>{projects.length}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>Tổng giá trị</span>
            <span style={{ color: DS.blue, background: `${DS.blue}15`, borderRadius: 8, padding: "4px", display: "flex" }}>
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div style={{ color: DS.text, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{fmtB(totalValue)}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginTop: 2 }}>{fmtVND(totalValue)}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>Tiến độ TB</span>
            <span style={{ color: DS.amber, background: `${DS.amber}15`, borderRadius: 8, padding: "4px", display: "flex" }}>
              <Calendar size={16} />
            </span>
          </div>
          <div style={{ color: DS.text, fontSize: "1.75rem", fontWeight: 700, fontFamily: DS.heading }}>{avgProgress}%</div>
        </motion.div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : projects.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, fontSize: 14 }}>Chưa có dự án hoàn thành</div>
      ) : (
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                  {["Dự án", "Khách hàng", "Giá trị", "Tiến độ", "Bắt đầu", "Kết thúc"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${DS.border}` }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono }}>{p.orderNumber}</div>
                    </td>
                    <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>{p.customerName ?? "—"}</td>
                    <td style={{ padding: "12px 16px", color: DS.green, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>
                      {p.totalValue ? fmtVND(p.totalValue) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 60, height: 4, background: DS.bg, borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${p.progress ?? 100}%`, background: DS.green, borderRadius: 2 }} />
                        </div>
                        <span style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono }}>{p.progress ?? 100}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{fmtDate(p.startDate)}</td>
                    <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{fmtDate(p.endDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
