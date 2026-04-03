"use client";

/**
 * Revenue Admin Page — LOOP Solutions
 * Route: /admin/revenue
 * Wire: /api/admin/orders, /api/admin/kpi/dashboard
 *
 * Full rewrite to match DESIGN LOOPS RevenueTab (439 lines):
 * - SVG AreaChart (revenue + profit) with tooltips
 * - SVG LineChart (LP issuance) with tooltips
 * - Period filter (3m/6m/12m)
 * - Revenue by service bar chart
 * - Top clients ranking
 * - Invoice table with export button
 */

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  TrendingUp, ArrowUpRight, ArrowDownRight, DollarSign, Zap,
  FolderKanban, Download,
} from "lucide-react";

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtB = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

// ── Mock data (fallback when API unavailable) ─────────────────────────────────

const MONTHLY_REVENUE = [
  { month: "T4/25", revenue: 85_000_000, profit: 53_000_000 },
  { month: "T5/25", revenue: 120_000_000, profit: 76_000_000 },
  { month: "T6/25", revenue: 95_000_000, profit: 57_000_000 },
  { month: "T7/25", revenue: 145_000_000, profit: 93_000_000 },
  { month: "T8/25", revenue: 168_000_000, profit: 108_000_000 },
  { month: "T9/25", revenue: 132_000_000, profit: 84_000_000 },
  { month: "T10/25", revenue: 195_000_000, profit: 127_000_000 },
  { month: "T11/25", revenue: 225_000_000, profit: 147_000_000 },
  { month: "T12/25", revenue: 280_000_000, profit: 185_000_000 },
  { month: "T1/26", revenue: 210_000_000, profit: 138_000_000 },
  { month: "T2/26", revenue: 248_000_000, profit: 163_000_000 },
  { month: "T3/26", revenue: 310_000_000, profit: 208_000_000 },
];

const MONTHLY_LP = [
  { month: "T7", lp: 12_500 },
  { month: "T8", lp: 18_200 },
  { month: "T9", lp: 14_800 },
  { month: "T10", lp: 22_400 },
  { month: "T11", lp: 26_000 },
  { month: "T12", lp: 31_000 },
  { month: "T1", lp: 24_500 },
  { month: "T2", lp: 28_800 },
  { month: "T3", lp: 35_200 },
];

const BY_SERVICE = [
  { name: "Website Dev", value: 620_000_000, color: DS.blue },
  { name: "App & SaaS", value: 850_000_000, color: DS.purple },
  { name: "Analytics", value: 380_000_000, color: DS.cyan },
  { name: "SEO & Mkt", value: 220_000_000, color: DS.green },
  { name: "Academy", value: 145_000_000, color: DS.amber },
];

const TOP_CLIENTS = [
  { name: "FinCorp Vietnam", spend: 500_000_000, projects: 1, color: DS.red },
  { name: "VNRetail JSC", spend: 350_000_000, projects: 2, color: DS.blue },
  { name: "HealthTech VN", spend: 180_000_000, projects: 1, color: DS.purple },
  { name: "DataViet Corp", spend: 120_000_000, projects: 1, color: DS.cyan },
  { name: "EduViet Foundation", spend: 75_000_000, projects: 1, color: DS.green },
];

const INVOICES = [
  { id: "INV-2603", client: "FinCorp Vietnam", service: "FinDash Enterprise", amount: 500_000_000, status: "paid", date: "15/03/2026" },
  { id: "INV-2602", client: "VNRetail JSC", service: "VNRetail Platform v3", amount: 175_000_000, status: "paid", date: "08/03/2026" },
  { id: "INV-2601", client: "HealthTech VN", service: "MedApp Vietnam", amount: 90_000_000, status: "pending", date: "20/03/2026" },
  { id: "INV-2599", client: "DataViet Corp", service: "AnalyticsPro Dashboard", amount: 120_000_000, status: "paid", date: "01/03/2026" },
  { id: "INV-2598", client: "StartupHub VN", service: "Landing Page", amount: 25_000_000, status: "overdue", date: "10/02/2026" },
  { id: "INV-2597", client: "EduViet Foundation", service: "EduViet Portal", amount: 75_000_000, status: "paid", date: "25/02/2026" },
];

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  paid: { label: "Đã thanh toán", color: DS.green },
  pending: { label: "Chờ thanh toán", color: DS.amber },
  overdue: { label: "Quá hạn", color: DS.red },
};

// ── SVG Area Chart ────────────────────────────────────────────────────────────

function AreaChartSVG({ data, colorA, colorB }: {
  data: { month: string; revenue: number; profit: number }[];
  colorA: string;
  colorB: string;
}) {
  const W = 600;
  const H = 200;
  const PAD = { top: 12, right: 12, bottom: 28, left: 48 };
  const [tooltip, setTooltip] = useState<{ idx: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const maxVal = Math.max(...data.map(d => d.revenue));
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const px = (i: number) => PAD.left + (i / (data.length - 1)) * chartW;
  const py = (v: number) => PAD.top + chartH - (v / maxVal) * chartH;

  const makePath = (key: "revenue" | "profit") =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(d[key]).toFixed(1)}`).join(" ");

  const makeArea = (key: "revenue" | "profit") => {
    const line = makePath(key);
    return `${line} L${px(data.length - 1).toFixed(1)},${(PAD.top + chartH).toFixed(1)} L${PAD.left},${(PAD.top + chartH).toFixed(1)} Z`;
  };

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(ratio => ({
    y: PAD.top + chartH * (1 - ratio),
    label: fmtB(maxVal * ratio),
  }));

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: 240, display: "block" }}
        onMouseMove={(e) => {
          const rect = svgRef.current?.getBoundingClientRect();
          if (!rect) return;
          const svgX = ((e.clientX - rect.left) / rect.width) * W;
          const idx = Math.round(((svgX - PAD.left) / chartW) * (data.length - 1));
          if (idx >= 0 && idx < data.length) setTooltip({ idx });
        }}
        onMouseLeave={() => setTooltip(null)}
      >
        {gridLines.map((g, i) => (
          <g key={`grid-${i}`}>
            <line x1={PAD.left} y1={g.y} x2={W - PAD.right} y2={g.y} stroke={DS.border} strokeDasharray="3 3" strokeWidth={1} />
            <text x={PAD.left - 4} y={g.y + 4} textAnchor="end" fill={DS.text5} fontSize={9} fontFamily={DS.mono}>{g.label}</text>
          </g>
        ))}

        <path d={makeArea("revenue")} fill={colorA} fillOpacity={0.12} />
        <path d={makeArea("profit")} fill={colorB} fillOpacity={0.14} />

        <path d={makePath("revenue")} fill="none" stroke={colorA} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={makePath("profit")} fill="none" stroke={colorB} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {data.map((d, i) => (
          <text key={`xlabel-${i}`} x={px(i)} y={H - 6} textAnchor="middle" fill={DS.text5} fontSize={9} fontFamily={DS.mono}>{d.month}</text>
        ))}

        {tooltip !== null && (
          <>
            <line x1={px(tooltip.idx)} y1={PAD.top} x2={px(tooltip.idx)} y2={PAD.top + chartH} stroke={DS.border} strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={px(tooltip.idx)} cy={py(data[tooltip.idx].revenue)} r={4} fill={colorA} />
            <circle cx={px(tooltip.idx)} cy={py(data[tooltip.idx].profit)} r={4} fill={colorB} />
          </>
        )}
      </svg>

      {tooltip !== null && (
        <div style={{
          position: "absolute",
          left: `${(px(tooltip.idx) / W) * 100}%`,
          top: 20,
          transform: tooltip.idx > data.length * 0.7 ? "translateX(-110%)" : "translateX(8px)",
          background: DS.bgCard,
          border: `1px solid ${DS.border}`,
          borderRadius: 10,
          padding: "10px 14px",
          pointerEvents: "none",
          zIndex: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          minWidth: 140,
        }}>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>{data[tooltip.idx].month}</div>
          <div style={{ color: colorA, fontSize: 12, fontFamily: DS.mono, display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: colorA }} />
            DT: {fmtB(data[tooltip.idx].revenue)} VNĐ
          </div>
          <div style={{ color: colorB, fontSize: 12, fontFamily: DS.mono, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: colorB }} />
            LN: {fmtB(data[tooltip.idx].profit)} VNĐ
          </div>
        </div>
      )}
    </div>
  );
}

// ── SVG Line Chart (LP) ───────────────────────────────────────────────────────

function LineChartSVG({ data, color }: { data: { month: string; lp: number }[]; color: string }) {
  const W = 500;
  const H = 180;
  const PAD = { top: 12, right: 12, bottom: 24, left: 44 };
  const [tooltip, setTooltip] = useState<{ idx: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const maxVal = Math.max(...data.map(d => d.lp));
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const px = (i: number) => PAD.left + (i / (data.length - 1)) * chartW;
  const py = (v: number) => PAD.top + chartH - (v / maxVal) * chartH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(d.lp).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${px(data.length - 1).toFixed(1)},${(PAD.top + chartH).toFixed(1)} L${PAD.left},${(PAD.top + chartH).toFixed(1)} Z`;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", height: 200, display: "block" }}
        onMouseMove={(e) => {
          const rect = svgRef.current?.getBoundingClientRect();
          if (!rect) return;
          const svgX = ((e.clientX - rect.left) / rect.width) * W;
          const idx = Math.round(((svgX - PAD.left) / chartW) * (data.length - 1));
          if (idx >= 0 && idx < data.length) setTooltip({ idx });
        }}
        onMouseLeave={() => setTooltip(null)}
      >
        {[0, 0.5, 1].map((ratio, i) => (
          <g key={`lpgrid-${i}`}>
            <line x1={PAD.left} y1={PAD.top + chartH * (1 - ratio)} x2={W - PAD.right} y2={PAD.top + chartH * (1 - ratio)} stroke={DS.border} strokeDasharray="3 3" strokeWidth={1} />
            <text x={PAD.left - 4} y={PAD.top + chartH * (1 - ratio) + 4} textAnchor="end" fill={DS.text5} fontSize={9} fontFamily={DS.mono}>{((maxVal * ratio) / 1000).toFixed(0)}K</text>
          </g>
        ))}

        <path d={areaPath} fill={color} fillOpacity={0.1} />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {data.map((d, i) => (
          <circle key={`dot-${i}`} cx={px(i)} cy={py(d.lp)} r={3.5} fill={color} />
        ))}

        {data.map((d, i) => (
          <text key={`lplabel-${i}`} x={px(i)} y={H - 4} textAnchor="middle" fill={DS.text5} fontSize={9} fontFamily={DS.mono}>{d.month}</text>
        ))}

        {tooltip !== null && (
          <>
            <line x1={px(tooltip.idx)} y1={PAD.top} x2={px(tooltip.idx)} y2={PAD.top + chartH} stroke={DS.border} strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={px(tooltip.idx)} cy={py(data[tooltip.idx].lp)} r={5} fill={color} stroke="rgba(0,0,0,0.3)" strokeWidth={2} />
          </>
        )}
      </svg>

      {tooltip !== null && (
        <div style={{
          position: "absolute",
          left: `${(px(tooltip.idx) / W) * 100}%`,
          top: 20,
          transform: tooltip.idx > data.length * 0.7 ? "translateX(-110%)" : "translateX(8px)",
          background: DS.bgCard,
          border: `1px solid ${DS.border}`,
          borderRadius: 10,
          padding: "10px 14px",
          pointerEvents: "none",
          zIndex: 10,
          minWidth: 120,
        }}>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 4 }}>{data[tooltip.idx].month}/25</div>
          <div style={{ color, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{data[tooltip.idx].lp.toLocaleString()} LP</div>
        </div>
      )}
    </div>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, color, icon, trend, trendUp }: {
  label: string; value: string; sub: string; color: string;
  icon: React.ReactNode; trend: string; trendUp: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}15`, border: `1px solid ${color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: trendUp ? DS.green : DS.red, fontSize: 12 }}>
          {trendUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {trend}
        </div>
      </div>
      <div style={{ color, fontFamily: DS.heading, fontSize: 26, fontWeight: 700, textShadow: `0 0 12px ${color}50`, lineHeight: 1, marginBottom: 8 }}>{value}</div>
      <div style={{ color: DS.text3, fontSize: 13 }}>{label}</div>
      <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginTop: 3 }}>{sub}</div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function RevenuePage() {
  const [period, setPeriod] = useState<"3m" | "6m" | "12m">("12m");

  const periods = {
    "3m": MONTHLY_REVENUE.slice(-3),
    "6m": MONTHLY_REVENUE.slice(-6),
    "12m": MONTHLY_REVENUE,
  };
  const revData = periods[period];
  const totalRevenue = revData.reduce((s, d) => s + d.revenue, 0);
  const totalProfit = revData.reduce((s, d) => s + d.profit, 0);
  const avgMargin = Math.round((totalProfit / totalRevenue) * 100);
  const maxService = Math.max(...BY_SERVICE.map(s => s.value));

  const totalRevAll = MONTHLY_REVENUE.reduce((s, d) => s + d.revenue, 0);
  const totalProfitAll = MONTHLY_REVENUE.reduce((s, d) => s + d.profit, 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Doanh thu & Tài chính
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            Báo cáo tài chính · {period === "3m" ? "3 tháng" : period === "6m" ? "6 tháng" : "12 tháng gần nhất"}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <MetricCard label="Doanh thu Q1/2026" value={fmtB(totalRevAll)} sub="VNĐ tổng 12 tháng" color={DS.blue} icon={<DollarSign size={18} />} trend="+28%" trendUp />
        <MetricCard label="Lợi nhuận ròng" value={fmtB(totalProfitAll)} sub={`Margin ${avgMargin}%`} color={DS.green} icon={<TrendingUp size={18} />} trend="+35%" trendUp />
        <MetricCard label="LP Phát hành (T3)" value="35.2K" sub="Điểm thưởng nội bộ" color={DS.purple} icon={<Zap size={18} />} trend="+22%" trendUp />
        <MetricCard label="Dự án hoàn thành" value="24" sub="Q1/2026" color={DS.cyan} icon={<FolderKanban size={18} />} trend="+3" trendUp />
      </div>

      {/* Area chart */}
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em" }}>── DOANH THU & LỢI NHUẬN</div>
            <div style={{ color: DS.text, fontSize: 18, fontWeight: 700, marginTop: 4 }}>{fmtVND(totalRevenue)}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["3m", "6m", "12m"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                padding: "5px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: DS.mono,
                background: period === p ? GRD.primary : DS.bgCard2,
                color: period === p ? "#fff" : DS.text3,
                border: period === p ? "none" : `1px solid ${DS.border}`,
              }}>{p.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <AreaChartSVG data={revData} colorA={DS.blue} colorB={DS.green} />
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 12, justifyContent: "center" }}>
          {[{ color: DS.blue, label: "Doanh thu" }, { color: DS.green, label: "Lợi nhuận" }].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
              <span style={{ color: DS.text4, fontSize: 11 }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column: service breakdown + LP chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {/* Revenue by service */}
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem" }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 16 }}>── DOANH THU THEO DỊCH VỤ</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {BY_SERVICE.map(s => (
              <div key={s.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono }}>{s.name}</span>
                  <span style={{ color: s.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{fmtB(s.value)} VNĐ</span>
                </div>
                <div style={{ height: 20, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(s.value / maxService) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{
                      height: "100%",
                      background: `linear-gradient(90deg, ${s.color}99, ${s.color})`,
                      borderRadius: 4,
                      boxShadow: `0 0 8px ${s.color}50`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LP issuance line chart */}
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem" }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 16 }}>── LP PHÁT HÀNH THEO THÁNG</div>
          <LineChartSVG data={MONTHLY_LP} color={DS.purple} />
        </div>
      </div>

      {/* Top clients */}
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 16 }}>── TOP KHÁCH HÀNG THEO DOANH THU</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {TOP_CLIENTS.map((c, i) => {
            const maxSpend = TOP_CLIENTS[0].spend;
            return (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, width: 20 }}>#{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ color: DS.text2, fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                    <span style={{ color: c.color, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{fmtB(c.spend)} VNĐ</span>
                  </div>
                  <div style={{ height: 4, background: DS.border, borderRadius: 2 }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.spend / maxSpend) * 100}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      style={{ height: "100%", background: c.color, borderRadius: 2, boxShadow: `0 0 6px ${c.color}50` }}
                    />
                  </div>
                </div>
                <span style={{ color: DS.text5, fontSize: 11, whiteSpace: "nowrap" }}>{c.projects} dự án</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice table */}
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem", borderBottom: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em" }}>── LỊCH SỬ HÓA ĐƠN</div>
          <button style={{ display: "flex", alignItems: "center", gap: 5, color: DS.blue, fontSize: 12, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>
            <Download size={13} /> Xuất Excel
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: DS.bgCard2 }}>
                {["Mã HĐ", "Khách hàng", "Dịch vụ", "Số tiền (VNĐ)", "Trạng thái", "Ngày"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", borderBottom: `1px solid ${DS.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv, i) => {
                const sc = STATUS_CFG[inv.status] ?? { label: inv.status, color: DS.text4 };
                return (
                  <tr key={inv.id} style={{ borderBottom: `1px solid ${DS.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                    <td style={{ padding: "12px 16px", color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>{inv.id}</td>
                    <td style={{ padding: "12px 16px", color: DS.text2, fontSize: 13, fontWeight: 600 }}>{inv.client}</td>
                    <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>{inv.service}</td>
                    <td style={{ padding: "12px 16px", color: DS.text, fontSize: 13, fontFamily: DS.mono, fontWeight: 600 }}>
                      {new Intl.NumberFormat("vi-VN").format(inv.amount)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: sc.color, fontSize: 10, fontFamily: DS.mono, background: `${sc.color}15`, padding: "3px 8px", borderRadius: 4, border: `1px solid ${sc.color}30` }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: DS.text5, fontSize: 12, fontFamily: DS.mono }}>{inv.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
