"use client";

/**
 * Off-System Payments Admin Page
 * Route: /admin/off_system_payments
 * Record off-system payments + auto-split by RevenueSplitConfig.
 */

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { X, Plus, Trash2, Link2, Calculator, ChevronDown, CheckCircle2, Clock, AlertCircle } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OffSystemSplit {
  id: string;
  memberId: string;
  memberName: string;
  memberRank: string;
  memberAvatar?: string;
  projectRole: string;
  percentage: number;
  lpAmount: number;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
}

interface OffSystemPayment {
  id: string;
  orderId?: string;
  amountVnd: number;
  lpRate: number;
  totalLp: number;
  description?: string;
  note?: string;
  createdBy: string;
  createdAt: string;
  order?: { orderNumber: string; customerName: string };
  splits: OffSystemSplit[];
}

interface RevenueSplitConfig {
  id: string;
  key: string;
  label: string;
  percentage: number;
  isActive: boolean;
}

// ── Formatters ─────────────────────────────────────────────────────────────────

const fmtVND = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);
const fmtLP = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M LP` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K LP` : `${n} LP`;

// ── Create Payment Modal ──────────────────────────────────────────────────────

function CreatePaymentModal({
  configs,
  lpRate,
  onClose,
  onSuccess,
}: {
  configs: RevenueSplitConfig[];
  lpRate: number;
  onClose: () => void;
  onSuccess: (payment: OffSystemPayment) => void;
}) {
  const [amountVnd, setAmountVnd] = useState(3_000_000);
  const [orderId, setOrderId] = useState("");
  const [description, setDescription] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const totalLp = Math.floor(amountVnd / lpRate);
  const activeConfigs = configs.filter(c => c.isActive && c.key !== "company" && c.percentage > 0);
  const rows = activeConfigs.map(c => ({
    ...c,
    vnd: Math.floor((amountVnd * c.percentage) / 100),
    lp: Math.floor((totalLp * c.percentage) / 100),
  }));

  const [isCreating, setIsCreating] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: "100%", background: DS.bgCard2, border: `1px solid ${DS.border}`,
    borderRadius: 8, padding: "9px 12px", color: DS.text, fontSize: 13, outline: "none",
    fontFamily: DS.body, boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block" as const,
    marginBottom: 5, letterSpacing: "0.1em",
  };

  const handleCreate = async () => {
    if (amountVnd <= 0) { setError("Số tiền phải lớn hơn 0"); return; }
    setIsCreating(true);
    try {
      const res = await adminApi.post<{ data: OffSystemPayment }>(
        "/api/admin/off-system-payments",
        {
          amountVnd,
          orderId: orderId || undefined,
          description: description || undefined,
          note: note || undefined,
        }
      );
      onSuccess(res.data);
      onClose();
    } catch {
      setError("Lỗi tạo payment. Vui lòng thử lại.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.88)", backdropFilter: "blur(10px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: `1px solid ${DS.border}`, flexShrink: 0 }}>
          <div>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.15em" }}>── CHI PHÍ NGOÀI HỆ THỐNG</div>
            <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginTop: 2 }}>Nhập chi phí &amp; quy đổi LP</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Amount */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>SỐ TIỀN (VNĐ)</label>
              <input type="number" value={amountVnd} onChange={e => setAmountVnd(Number(e.target.value))}
                min={1} style={{ ...inputStyle, color: DS.pink, fontFamily: DS.mono, fontSize: 14 }} />
            </div>
            <div>
              <label style={labelStyle}>TỶ GIÁ (1 LP = ? VND)</label>
              <div style={{ ...inputStyle, color: DS.green, fontFamily: DS.mono, fontSize: 14, display: "flex", alignItems: "center" }}>
                {lpRate.toLocaleString("vi-VN")}
              </div>
            </div>
          </div>

          {/* LP preview */}
          <div style={{ display: "flex", gap: 8, padding: "10px 14px", borderRadius: 12, background: `${DS.purple}10`, border: `1px solid ${DS.purple}25` }}>
            <Calculator size={14} style={{ color: DS.purple, marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ color: DS.purple, fontFamily: DS.mono, fontWeight: 700, fontSize: 15 }}>
                = {fmtLP(totalLp)}
              </div>
              <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
                ≈ {fmtVND(totalLp * lpRate)} VND · ({amountVnd.toLocaleString("vi-VN")} ÷ {lpRate.toLocaleString("vi-VN")})
              </div>
            </div>
          </div>

          {/* Order link */}
          <div>
            <label style={labelStyle}>GẮN ORDER (tùy chọn)</label>
            <input value={orderId} onChange={e => setOrderId(e.target.value)}
              placeholder="Dán Order ID hoặc bỏ trống"
              style={{ ...inputStyle, fontFamily: DS.mono }} />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>MÔ TẢ</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              placeholder="VD: Chi phí dịch vụ SEO tháng 4/2026"
              style={inputStyle} />
          </div>

          {/* Note */}
          <div>
            <label style={labelStyle}>GHI CHÚ</label>
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="Ghi chú thêm (nội bộ)"
              style={inputStyle} />
          </div>

          {/* Split preview */}
          <div>
            <div style={{ ...labelStyle, marginBottom: 8 }}>PREVIEW — CHIA LP THEO CẤU HÌNH</div>
            <div style={{ background: DS.bgCard2, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 110px 90px", padding: "8px 14px", borderBottom: `1px solid ${DS.border}` }}>
                {["Role", "%", "VNĐ", "LP"].map(h => (
                  <div key={h} style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.1em" }}>{h}</div>
                ))}
              </div>
              {rows.map(r => (
                <div key={r.key} style={{ display: "grid", gridTemplateColumns: "1fr 50px 110px 90px", padding: "8px 14px", borderBottom: `1px solid ${DS.border}` }}>
                  <div style={{ color: DS.text2, fontSize: 12 }}>{r.label}</div>
                  <div style={{ color: DS.amber, fontFamily: DS.mono, fontSize: 12 }}>{r.percentage}%</div>
                  <div style={{ color: DS.text3, fontFamily: DS.mono, fontSize: 11 }}>{r.vnd.toLocaleString("vi-VN")}</div>
                  <div style={{ color: DS.green, fontFamily: DS.mono, fontSize: 12, fontWeight: 700, textAlign: "right" }}>{fmtLP(r.lp)}</div>
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 110px 90px", padding: "8px 14px" }}>
                <div style={{ color: DS.text5, fontSize: 11 }}>Công ty (phần còn lại)</div>
                <div style={{ color: DS.text5, fontFamily: DS.mono, fontSize: 11 }}>
                  {Math.max(0, 100 - activeConfigs.reduce((s, c) => s + c.percentage, 0)).toFixed(1)}%
                </div>
                <div />
                <div />
              </div>
            </div>
          </div>

          {error && (
            <div style={{ color: DS.red, fontSize: 11, background: `${DS.red}10`, border: `1px solid ${DS.red}25`, borderRadius: 8, padding: "8px 12px" }}>
              <AlertCircle size={12} style={{ display: "inline", marginRight: 6 }} />
              {error}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, padding: "1.25rem 1.5rem", borderTop: `1px solid ${DS.border}`, flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ flex: 1, background: "none", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px", color: DS.text3, cursor: "pointer", fontSize: 13 }}>
            Hủy
          </button>
          <button onClick={handleCreate}
            disabled={isCreating}
            style={{ flex: 2, background: isCreating ? DS.text5 : GRD.primary, color: "#fff", border: "none", borderRadius: 10, padding: "10px", cursor: isCreating ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {isCreating ? "Đang tạo..." : <><Plus size={13} /> Tạo Off-System Payment</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    pending:   { color: DS.amber, bg: `${DS.amber}15`, border: `${DS.amber}30`, icon: <Clock size={10} />, label: "Chờ duyệt" },
    approved:  { color: DS.green, bg: `${DS.green}15`, border: `${DS.green}30`, icon: <CheckCircle2 size={10} />, label: "Đã duyệt" },
    rejected:  { color: DS.red, bg: `${DS.red}15`, border: `${DS.red}30`, icon: <AlertCircle size={10} />, label: "Từ chối" },
  }[status] ?? { color: DS.text5, bg: DS.border, border: DS.border, icon: null, label: status };

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 99, fontSize: 10, fontFamily: DS.mono,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OffSystemPaymentsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["admin", "off-system-payments"],
    queryFn: () => adminApi.get<{
      data: OffSystemPayment[];
      pagination: { total: number };
      summary: { totalVnd: number };
    }>("/api/admin/off-system-payments"),
  });

  const { data: configsData } = useQuery({
    queryKey: ["admin", "revenue-split-configs"],
    queryFn: () => adminApi.get<{ data: RevenueSplitConfig[] }>("/api/admin/revenue-split-configs"),
  });

  const { data: rateData } = useQuery({
    queryKey: ["admin", "settings", "lp-rate"],
    queryFn: () => adminApi.get<{ data: { lp_to_vnd: number } }>("/api/admin/settings/lp-rate"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/admin/off-system-payments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "off-system-payments"] }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ paymentId, splitId }: { paymentId: string; splitId: string }) =>
      adminApi.post(`/api/admin/off-system-payments/${paymentId}/splits/${splitId}/approve`, undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "off-system-payments"] }),
  });

  const payments = paymentsData?.data ?? [];
  const configs = configsData?.data ?? [];
  const lpRate = rateData?.data?.lp_to_vnd ?? 1_000;
  const totalVnd = paymentsData?.summary?.totalVnd ?? 0;

  const handleSuccess = (payment: OffSystemPayment) => {
    qc.invalidateQueries({ queryKey: ["admin", "off-system-payments"] });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Chi phí ngoài hệ thống
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            Ghi nhận thu ngoài hệ thống · Quy đổi LP · Chia cho role
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: DS.mono, boxShadow: "0 0 16px rgba(129,140,248,0.3)" }}>
          <Plus size={13} /> Nhập chi phí
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Tổng thu ngoài", value: fmtVND(totalVnd), sub: `${payments.length} khoản`, color: DS.purple },
          { label: "Số khoản đã tạo", value: String(payments.length), sub: "payments", color: DS.blue },
          { label: "Tỷ giá hiện tại", value: `1:${lpRate}`, sub: "LP → VND", color: DS.green },
          { label: "Tổng LP quy đổi", value: fmtLP(payments.reduce((s, p) => s + p.totalLp, 0)), sub: "toàn thời gian", color: DS.amber },
        ].map(s => (
          <div key={s.label} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1rem" }}>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 20, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 2 }}>{s.label}</div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 1 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Payments list */}
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, overflow: "hidden" }}>
        {paymentsLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : payments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>
            Chưa có chi phí ngoài hệ thống nào
          </div>
        ) : (
          payments.map((payment, i) => (
            <div key={payment.id} style={{ padding: "1.25rem", borderBottom: i < payments.length - 1 ? `1px solid ${DS.border}` : "none" }}>
              {/* Header row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>
                    {payment.amountVnd.toLocaleString("vi-VN")} VND
                    <span style={{ color: DS.pink, fontFamily: DS.mono, marginLeft: 10 }}>= {fmtLP(payment.totalLp)}</span>
                  </div>
                  <div style={{ color: DS.text5, fontSize: 11, marginTop: 2, fontFamily: DS.mono }}>
                    {payment.description ?? "Không có mô tả"}
                    {payment.order && (
                      <span style={{ marginLeft: 8, color: DS.cosmicCyan }}>
                        <Link2 size={10} style={{ display: "inline", marginRight: 3 }} />
                        {payment.order.orderNumber} — {payment.order.customerName}
                      </span>
                    )}
                  </div>
                  <div style={{ color: DS.text5, fontSize: 10, marginTop: 2, fontFamily: DS.mono }}>
                    {new Date(payment.createdAt).toLocaleString("vi-VN")}
                    {payment.note && <span style={{ marginLeft: 8 }}>· {payment.note}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
                    {payment.splits.length} splits
                  </div>
                  <button
                    onClick={() => { if (confirm("Xóa payment này?")) deleteMutation.mutate(payment.id); }}
                    style={{ background: `${DS.red}12`, border: `1px solid ${DS.red}25`, borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: DS.red, display: "flex", alignItems: "center" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Splits */}
              {payment.splits.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {payment.splits.map(split => (
                    <div key={split.id} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", borderRadius: 10,
                      background: `${DS.bgCard2}`, border: `1px solid ${DS.border}`,
                      fontSize: 11,
                    }}>
                      <span style={{ color: DS.text3 }}>{split.projectRole}</span>
                      <span style={{ color: DS.amber, fontFamily: DS.mono }}>{split.percentage}%</span>
                      <span style={{ color: DS.green, fontFamily: DS.mono, fontWeight: 700 }}>{fmtLP(split.lpAmount)}</span>
                      <StatusBadge status={split.status} />
                      {split.status === "pending" && (
                        <button
                          onClick={() => approveMutation.mutate({ paymentId: payment.id, splitId: split.id })}
                          disabled={approveMutation.isPending}
                          style={{
                            background: `${DS.green}20`, border: `1px solid ${DS.green}40`,
                            borderRadius: 6, padding: "2px 8px", cursor: "pointer",
                            color: DS.green, fontSize: 9, fontFamily: DS.mono, display: "flex", alignItems: "center", gap: 3,
                          }}>
                          <CheckCircle2 size={10} /> Duyệt
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showCreate && (
          <CreatePaymentModal
            configs={configs}
            lpRate={lpRate}
            onClose={() => setShowCreate(false)}
            onSuccess={handleSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}