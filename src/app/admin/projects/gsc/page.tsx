"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Search, TrendingUp, MousePointerClick, Eye, BarChart3, Upload, X, RefreshCw } from "lucide-react";

interface GscMetric {
  id: string;
  projectId: string;
  pageUrl: string;
  keyword: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  dataDate: string;
  project: { id: string; orderNumber: string; customerName: string; companyName: string | null };
}

interface Project {
  id: string; orderNumber: string; customerName: string; companyName: string | null;
}

interface ImportRow {
  projectId: string; pageUrl: string; keyword: string;
  impressions: number; clicks: number; ctr: number; position: number; dataDate: string;
}

const fmtNum = (n: number) => Intl.NumberFormat("vi-VN").format(n);
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtPos = (n: number) => n.toFixed(1);

const VI_DATE = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

function PositionBadge({ pos }: { pos: number }) {
  if (pos === 0) return <span className="text-gray-500">—</span>;
  if (pos <= 3) return <span className="font-bold" style={{ color: "#10B981" }}>🏆 {fmtPos(pos)}</span>;
  if (pos <= 10) return <span className="font-bold" style={{ color: "#F59E0B" }}>{fmtPos(pos)}</span>;
  return <span style={{ color: "rgba(209,213,219,0.5)" }}>{fmtPos(pos)}</span>;
}

export default function GscPage() {
  const [metrics, setMetrics] = useState<GscMetric[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (projectFilter) params.set("projectId", projectFilter);
      params.set("page", String(page));
      const res = await fetch(`/api/admin/gsc?${params}`);
      const json = await res.json();
      setMetrics(json.data ?? []);
    } finally { setLoading(false); }
  }, [projectFilter, page]);

  const fetchProjects = useCallback(async () => {
    const res = await fetch("/api/admin/orders?status=all");
    const json = await res.json();
    setProjects(json.data ?? []);
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);
  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // Summary stats
  const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0);
  const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0);
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const avgPosition = metrics.length > 0
    ? metrics.reduce((s, m) => s + m.position, 0) / metrics.length
    : 0;

  const filtered = metrics.filter(m =>
    !search || m.pageUrl.toLowerCase().includes(search.toLowerCase())
    || m.keyword.toLowerCase().includes(search.toLowerCase())
    || m.project.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const addImportRow = () => {
    setImportRows(r => [...r, {
      projectId: "", pageUrl: "", keyword: "",
      impressions: 0, clicks: 0, ctr: 0, position: 0,
      dataDate: new Date().toISOString().split("T")[0],
    }]);
  };

  const updateImportRow = (i: number, field: keyof ImportRow, value: string | number) => {
    setImportRows(r => r.map((row, idx) => {
      if (idx !== i) return row;
      const updated = { ...row, [field]: value };
      if (field === "impressions" || field === "clicks") {
        const imp = field === "impressions" ? Number(value) : updated.impressions;
        const clk = field === "clicks" ? Number(value) : updated.clicks;
        updated.ctr = imp > 0 ? clk / imp : 0;
      }
      return updated;
    }));
  };

  const importMetrics = async () => {
    const valid = importRows.filter(r => r.projectId && r.pageUrl);
    if (valid.length === 0) { toast.error("Cần ít nhất 1 dòng hợp lệ"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/gsc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics: valid }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`Đã import ${json.count} metrics`);
      setShowImport(false);
      setImportRows([]);
      fetchMetrics();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi import");
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">🔍 Google Search Console</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            SEO metrics — Impressions, Clicks, CTR, Position
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowImport(true); addImportRow(); }}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white"
            style={{ background: "#6366F1" }}>
            <Upload size={14} /> Import Metrics
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {([
          { label: "Tổng Impressions", value: fmtNum(totalImpressions), icon: Eye, color: "#6366F1" },
          { label: "Tổng Clicks", value: fmtNum(totalClicks), icon: MousePointerClick, color: "#3B82F6" },
          { label: "Avg CTR", value: fmtPct(avgCtr), icon: TrendingUp, color: "#10B981" },
          { label: "Avg Position", value: avgPosition > 0 ? fmtPos(avgPosition) : "—", icon: BarChart3, color: "#F59E0B" },
        ] as const).map(s => (
          <div key={s.label}
            className="rounded-xl border p-4 flex items-center gap-3"
            style={{ background: `${s.color}08`, borderColor: `${s.color}20` }}>
            <s.icon size={20} style={{ color: s.color }} />
            <div>
              <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs" style={{ color: "rgba(209,213,219,0.5)" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-64 rounded-lg border px-3"
          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
          <Search size={14} style={{ color: "rgba(209,213,219,0.4)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm URL, keyword, dự án…"
            className="flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-slate-600" />
        </div>
        <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm text-white"
          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
          <option value="">Tất cả dự án</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.orderNumber} — {p.customerName}</option>
          ))}
        </select>
        <button onClick={fetchMetrics}
          className="flex items-center gap-1 rounded-lg border px-3 py-2 text-xs"
          style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(209,213,219,0.5)" }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-12 rounded-lg animate-pulse"
              style={{ background: "rgba(255,255,255,0.04)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-xl border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-4xl mb-3">📊</p>
          <p className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>
            Chưa có dữ liệu SEO. Import metrics để bắt đầu.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Dự án", "URL / Trang", "Keyword", "Impressions", "Clicks", "CTR", "Position", "Ngày"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium"
                    style={{ color: "rgba(209,213,219,0.5)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {filtered.map(m => (
                <tr key={m.id} className="transition-colors"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-white">{m.project.orderNumber}</div>
                    <div className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>{m.project.customerName}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <a href={m.pageUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 truncate block max-w-full"
                      title={m.pageUrl}>
                      {m.pageUrl.length > 40 ? m.pageUrl.slice(0, 40) + "…" : m.pageUrl}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-white">
                      {m.keyword || <span style={{ color: "rgba(209,213,219,0.3)" }}>— all —</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-white">{fmtNum(m.impressions)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-white">{fmtNum(m.clicks)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    <span style={{ color: m.ctr > 0.05 ? "#10B981" : m.ctr > 0.01 ? "#F59E0B" : "#EF4444" }}>
                      {fmtPct(m.ctr)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs"><PositionBadge pos={m.position} /></td>
                  <td className="px-4 py-3 text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
                    {VI_DATE.format(new Date(m.dataDate))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl border p-6 w-full max-w-5xl my-8"
            style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload size={18} /> Import GSC Metrics
              </h2>
              <button onClick={() => { setShowImport(false); setImportRows([]); }}
                className="p-1 rounded" style={{ color: "rgba(209,213,219,0.5)" }}>
                <X size={18} />
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: "rgba(209,213,219,0.4)" }}>
              Thêm dòng mới, chọn dự án + nhập URL + keyword + dữ liệu từ Google Search Console.
              Impressions, Clicks, CTR sẽ được tính tự động.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {["Dự án *", "URL Trang *", "Keyword", "Impressions", "Clicks", "CTR", "Position", "Ngày"].map(h => (
                      <th key={h} className="px-2 py-2 text-left font-medium"
                        style={{ color: "rgba(209,213,219,0.5)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importRows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="px-2 py-1.5">
                        <select value={row.projectId}
                          onChange={e => updateImportRow(i, "projectId", e.target.value)}
                          className="w-full rounded border px-1 py-1 text-white text-xs"
                          style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                          <option value="">—</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.orderNumber}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={row.pageUrl}
                          onChange={e => updateImportRow(i, "pageUrl", e.target.value)}
                          placeholder="https://…"
                          className="w-full rounded border px-1 py-1 text-white text-xs"
                          style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={row.keyword}
                          onChange={e => updateImportRow(i, "keyword", e.target.value)}
                          placeholder="keyword…"
                          className="w-full rounded border px-1 py-1 text-white text-xs"
                          style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={row.impressions}
                          onChange={e => updateImportRow(i, "impressions", parseInt(e.target.value) || 0)}
                          className="w-20 rounded border px-1 py-1 text-white text-xs text-right font-mono"
                          style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" value={row.clicks}
                          onChange={e => updateImportRow(i, "clicks", parseInt(e.target.value) || 0)}
                          className="w-16 rounded border px-1 py-1 text-white text-xs text-right font-mono"
                          style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                      </td>
                      <td className="px-2 py-1.5 text-center font-mono text-white">
                        {fmtPct(row.ctr)}
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" step="0.1" value={row.position}
                          onChange={e => updateImportRow(i, "position", parseFloat(e.target.value) || 0)}
                          className="w-16 rounded border px-1 py-1 text-white text-xs text-right font-mono"
                          style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="date" value={row.dataDate}
                          onChange={e => updateImportRow(i, "dataDate", e.target.value)}
                          className="w-28 rounded border px-1 py-1 text-white text-xs"
                          style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                      </td>
                      <td className="px-2 py-1.5">
                        <button onClick={() => setImportRows(r => r.filter((_, idx) => idx !== i))}
                          className="text-red-400 hover:text-red-300 px-1">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={addImportRow}
                className="rounded-lg border px-4 py-2 text-sm font-medium"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(209,213,219,0.7)" }}>
                + Thêm dòng
              </button>
              <button onClick={importMetrics} disabled={saving}
                className="flex-1 rounded-lg py-2 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: "#6366F1" }}>
                {saving ? "Đang import…" : `Import ${importRows.filter(r => r.projectId && r.pageUrl).length} dòng`}
              </button>
              <button onClick={() => { setShowImport(false); setImportRows([]); }}
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
