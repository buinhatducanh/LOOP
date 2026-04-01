"use client";

/**
 * LP Manage Admin Page — LOOP Solutions
 * Route: /admin/lp_manage
 * Wire: /api/admin/lp-awards (manage/create/approve), /api/admin/lp-transactions
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { Zap, Plus, RefreshCw, Check, X, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

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

type LpAward = {
  id: string;
  memberId: string;
  member?: { name: string; role: string } | null;
  lpAmount: number;
  expAmount: number;
  source: string;
  status: string;
  task?: { title: string };
  project?: { orderNumber: string; customerName: string };
  createdAt: string;
};

type LpTransaction = {
  id: string;
  memberId: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
};

export default function LpManagePage() {
  const [tab, setTab] = useState<"awards" | "transactions">("awards");
  const qc = useQueryClient();

  const { data: awardsData, isLoading: awardsLoading, isFetching: awardsFetching } = useQuery({
    queryKey: ["admin", "lp", "awards-manage"],
    queryFn: () => adminApi.get<{ data: LpAward[]; total: number }>("/api/admin/lp-awards", { params: { limit: 50 } }),
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["admin", "lp", "transactions-manage"],
    queryFn: () => adminApi.get<{ data: LpTransaction[] }>("/api/admin/lp-transactions", { params: { limit: 50 } }),
  });

  const awards = awardsData?.data ?? [];
  const txs = txData?.data ?? [];

  const totalAwarded = awards.filter(a => a.status === "approved").reduce((s, a) => s + Number(a.lpAmount), 0);
  const totalPending = awards.filter(a => a.status === "pending").reduce((s, a) => s + Number(a.lpAmount), 0);
  const totalRedemptions = txs.filter(t => t.type === "redemption").reduce((s, t) => s + Math.abs(t.amount), 0);

  const approveMutation = useMutation({
    mutationFn: async (awardId: string) => {
      await adminApi.post(`/api/admin/lp-awards/${awardId}/approve`, {});
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "lp", "awards-manage"] }),
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Quản lý LP
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            Phát hành, duyệt, từ chối LP awards
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["admin", "lp"] })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={awardsFetching ? "animate-spin" : ""} /> Làm mới
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: DS.purple, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: DS.mono }}>
            <Plus size={13} /> Tạo award
          </button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>Đã duyệt</span>
            <Zap size={14} style={{ color: DS.green }} />
          </div>
          <div style={{ color: DS.green, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>+{fmtLP(totalAwarded)}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{awards.filter(a => a.status === "approved").length} awards</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>Chờ duyệt</span>
            <Wallet size={14} style={{ color: DS.amber }} />
          </div>
          <div style={{ color: DS.amber, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{fmtLP(totalPending)}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{awards.filter(a => a.status === "pending").length} awards</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>Đã đổi</span>
            <ArrowDownRight size={14} style={{ color: DS.red }} />
          </div>
          <div style={{ color: DS.red, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{fmtLP(totalRedemptions)}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>redemptions</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>Từ chối</span>
            <X size={14} style={{ color: DS.red }} />
          </div>
          <div style={{ color: DS.text, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{awards.filter(a => a.status === "rejected").length}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>awards</div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: "1rem", borderBottom: `1px solid ${DS.border}` }}>
        {([["awards", "Awards"], ["transactions", "Transactions"]] as const).map(([t, label]) => (
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
              fontWeight: tab === t ? 600 : 400,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Awards */}
      {tab === "awards" && (
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {awardsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : awards.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>Chưa có LP awards</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {["Thành viên", "LP", "Nguồn", "Dự án / Task", "Trạng thái", "Ngày", "Hành động"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {awards.map(a => {
                    const statusCfg = {
                      approved: { label: "✓ Duyệt", color: DS.green, bg: "rgba(34,197,94,0.1)" },
                      pending:  { label: "⏳ Chờ", color: DS.amber, bg: "rgba(245,158,11,0.1)" },
                      rejected: { label: "✕ Từ chối", color: DS.red, bg: "rgba(239,68,68,0.1)" },
                    }[a.status] ?? { label: a.status, color: DS.text4, bg: "transparent" };

                    return (
                      <tr key={a.id} style={{ borderBottom: `1px solid ${DS.border}` }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{a.member?.name ?? a.memberId}</div>
                          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{a.member?.role ?? a.source}</div>
                        </td>
                        <td style={{ padding: "12px 16px", color: DS.green, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>+{fmtLP(Number(a.lpAmount))}</td>
                        <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>{a.source}</td>
                        <td style={{ padding: "12px 16px" }}>
                          {a.project && <div style={{ color: DS.text3, fontSize: 12 }}>{a.project.orderNumber}</div>}
                          {a.task && <div style={{ color: DS.text4, fontSize: 11 }}>{a.task.title}</div>}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: statusCfg.bg, color: statusCfg.color, padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{fmtDate(a.createdAt)}</td>
                        <td style={{ padding: "12px 16px" }}>
                          {a.status === "pending" && (
                            <div style={{ display: "flex", gap: 4 }}>
                              <button
                                onClick={() => approveMutation.mutate(a.id)}
                                disabled={approveMutation.isPending}
                                style={{ padding: "4px 8px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: 6, color: DS.green, cursor: "pointer", fontSize: 11, fontFamily: DS.mono, display: "flex", alignItems: "center", gap: 3 }}
                              >
                                <Check size={11} /> Duyệt
                              </button>
                              <button style={{ padding: "4px 8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 6, color: DS.red, cursor: "pointer", fontSize: 11, fontFamily: DS.mono, display: "flex", alignItems: "center", gap: 3 }}>
                                <X size={11} /> Từ chối
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Transactions */}
      {tab === "transactions" && (
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {txLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : txs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>Chưa có giao dịch</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {["Thành viên", "Số LP", "Loại", "Mô tả", "Ngày"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {txs.map(t => {
                    const cfg = {
                      award: { label: "+Award", color: DS.green },
                      redemption: { label: "-Redeem", color: DS.red },
                      transfer: { label: "~Transfer", color: DS.amber },
                      adjustment: { label: "+Adj", color: DS.cyan },
                      bonus: { label: "+Bonus", color: DS.purple },
                    }[t.type] ?? { label: t.type, color: DS.text4 };
                    return (
                      <tr key={t.id} style={{ borderBottom: `1px solid ${DS.border}` }}>
                        <td style={{ padding: "12px 16px", color: DS.text, fontSize: 13, fontWeight: 500 }}>{t.memberId}</td>
                        <td style={{ padding: "12px 16px", color: cfg.color, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>
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
