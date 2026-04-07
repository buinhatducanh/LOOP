"use client";

/**
 * LP (Loyalty Points) Admin Page — LOOP Solutions
 * Route: /admin/lp
 * Data from: /api/admin/lp-awards, /api/admin/lp-transactions
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { TrendingUp, RefreshCw, Award, History, ArrowDown } from "lucide-react";

const fmtLP = (n: number) => {
  if (typeof n === "bigint") n = Number(n);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
};

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("vi-VN"); }
  catch { return String(d); }
};

// ── LP Metric Card ───────────────────────────────────────────
function LpCard({
  label, value, icon, color, sub,
}: {
  label: string; value: string; icon: React.ReactNode;
  color: string; sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: DS.bgCard, border: `1px solid ${DS.border}`,
        borderRadius: 12, padding: "1rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {label}
        </span>
        <span style={{ color, background: `${color}15`, borderRadius: 8, padding: "4px", display: "flex" }}>
          {icon}
        </span>
      </div>
      <div style={{ color: color, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>
        {value}
      </div>
      {sub && <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginTop: "0.25rem" }}>{sub}</div>}
    </motion.div>
  );
}

// ── LP Transactions ─────────────────────────────────────────
type LpTx = {
  id: string;
  memberId: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
};

const TX_TYPE_CFG: Record<string, { label: string; color: string }> = {
  award:      { label: "+Award", color: DS.green },
  redemption: { label: "-Redeem", color: DS.red },
  transfer:   { label: "~Transfer", color: DS.amber },
  adjustment: { label: "+Adj", color: DS.cyan },
  bonus:      { label: "+Bonus", color: DS.purple },
};

// ── Main ──────────────────────────────────────────────────
export default function LpPage() {
  const [tab, setTab] = useState<"awards" | "transactions">("awards");

  const { data: awardsData, isLoading: awardsLoading, refetch: refetchAwards } = useQuery({
    queryKey: ["admin", "lp", "awards"],
    queryFn: () => adminApi.get<{ data: unknown[]; pagination: unknown }>("/api/admin/lp-awards", { params: { limit: 20 } }),
  });

  const { data: txData, isLoading: txLoading, refetch: refetchTx } = useQuery({
    queryKey: ["admin", "lp", "transactions"],
    queryFn: () => adminApi.get<{ data: LpTx[] }>("/api/admin/lp-transactions", { params: { limit: 30 } }),
  });

  const awards = (awardsData?.data ?? []) as Record<string, unknown>[];
  const txs = txData?.data ?? [];

  const totalAwarded = awards
    .filter((a) => (a.status as string) === "approved")
    .reduce((s, a) => s + Number(a.lpAmount ?? 0), 0);
  const totalPending = awards
    .filter((a) => (a.status as string) === "pending")
    .reduce((s, a) => s + Number(a.lpAmount ?? 0), 0);
  const totalRedeemed = txs
    .filter((t) => t.type === "redemption")
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Tài chính LP
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            Quản lý Loop Points — Awards, Redemptions, Transfers
          </p>
        </div>
        <button
          onClick={() => tab === "awards" ? refetchAwards() : refetchTx()}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
        >
          <RefreshCw size={13} /> Làm mới
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <LpCard label="LP đã phát hành" value={fmtLP(totalAwarded)} icon={<Award size={16} />} color={DS.green} sub={`${awards.filter(a => (a.status as string) === "approved").length} awards`} />
        <LpCard label="LP chờ duyệt" value={fmtLP(totalPending)} icon={<TrendingUp size={16} />} color={DS.amber} sub="pending awards" />
        <LpCard label="LP đã đổi" value={fmtLP(totalRedeemed)} icon={<ArrowDown size={16} />} color={DS.red} sub={`${txs.filter(t => t.type === "redemption").length} redemptions`} />
        <LpCard label="Tổng giao dịch" value={String(txs.length)} icon={<History size={16} />} color={DS.purple} sub="30 ngày gần nhất" />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: "1rem", borderBottom: `1px solid ${DS.border}` }}>
        {(["awards", "transactions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 16px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === t ? DS.blue : "transparent"}`,
              color: tab === t ? DS.blue : DS.text4,
              fontSize: 13,
              fontFamily: DS.mono,
              cursor: "pointer",
              marginBottom: -1,
              transition: "all 0.15s",
              fontWeight: tab === t ? 600 : 400,
            }}
          >
            {t === "awards" ? "Awards" : "Transactions"}
          </button>
        ))}
      </div>

      {/* Awards table */}
      {tab === "awards" && (
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {awardsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : awards.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, fontSize: 14 }}>Chưa có LP awards</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {["Thành viên", "Số LP", "Lý do", "Trạng thái", "Ngày"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {awards.map((a, i) => {
                    const status = (a.status as string) ?? "pending";
                    const statusCfg = {
                      approved: { label: "✓ Duyệt", color: DS.green, bg: "rgba(34,197,94,0.1)" },
                      pending:  { label: "⏳ Chờ", color: DS.amber, bg: "rgba(245,158,11,0.1)" },
                      rejected: { label: "✕ Từ chối", color: DS.red, bg: "rgba(239,68,68,0.1)" },
                    }[status] ?? { label: status, color: DS.text4, bg: "transparent" };
                    return (
                      <tr key={(a.id as string) ?? i} style={{ borderBottom: `1px solid ${DS.border}` }}>
                        <td style={{ padding: "12px 16px", color: DS.text, fontSize: 13, fontWeight: 500 }}>{(a.memberName ?? a.memberId ?? "—") as string}</td>
                        <td style={{ padding: "12px 16px", color: DS.green, fontSize: 13, fontWeight: 700, fontFamily: DS.mono }}>
                          +{fmtLP(Number(a.lpAmount ?? 0))}
                        </td>
                        <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>{(a.reason ?? a.description ?? "—") as string}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: statusCfg.bg, color: statusCfg.color, padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{fmtDate(a.createdAt as string)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Transactions table */}
      {tab === "transactions" && (
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {txLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : txs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, fontSize: 14 }}>Chưa có giao dịch</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {["Thành viên", "Số LP", "Loại", "Mô tả", "Ngày"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txs.map((t) => {
                    const cfg = TX_TYPE_CFG[t.type] ?? { label: t.type, color: DS.text4 };
                    return (
                      <tr key={t.id} style={{ borderBottom: `1px solid ${DS.border}` }}>
                        <td style={{ padding: "12px 16px", color: DS.text, fontSize: 13, fontWeight: 500 }}>{t.memberId}</td>
                        <td style={{ padding: "12px 16px", color: cfg.color, fontSize: 13, fontWeight: 700, fontFamily: DS.mono }}>
                          {t.amount >= 0 ? "+" : ""}{fmtLP(Math.abs(t.amount))}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ color: cfg.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>{cfg.label}</span>
                        </td>
                        <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>{t.description ?? "—"}</td>
                        <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{fmtDate(t.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
