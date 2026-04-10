"use client";

/**
 * Project Intake Admin Page
 * Route: /admin/project_intake
 *
 * Handles two intake flows:
 * - External: ký HĐ bên ngoài → tạo Order + kích hoạt Kanban ngay
 * - Sales-assisted: sales mua hộ KH → tạo Order + gán PM, chờ KH duyệt
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import {
  X, Plus, FolderKanban, ShoppingCart, Users, ArrowRight,
  CheckCircle2, AlertCircle, Search, ChevronDown,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type IntakeType = "external" | "sales_assisted";

interface TeamMemberOption {
  id: string;
  name: string;
  rank: string;
  image?: string;
  avatar?: string;
}

interface ExternalProject {
  id: string;
  type: IntakeType;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  contractRef?: string;
  contractParty?: string;
  totalAmount?: number;
  status: string;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    isActiveProject: boolean;
    projectStatus?: string;
    totalAmount?: number;
    startedAt?: string;
  };
}

interface IntakePayload {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  requirements?: string;
  type: IntakeType;
  contractRef?: string;
  contractParty?: string;
  signedAt?: string;
  totalAmount?: number;
  pmMemberId?: string;
  teamMembers?: Array<{ memberId: string; roleKey: string; assignedLp?: number }>;
  activateKanban?: boolean;
  startedAt?: string;
}

// ── Formatters ─────────────────────────────────────────────────────────────────

const fmtVND = (n?: number | null) =>
  n ? (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : `${n}`)
    : "—";

const ROLE_LABELS: Record<string, string> = {
  pm: "PM",
  designer: "Designer",
  dev: "Dev",
  qa: "QA",
  seo: "SEO",
};

const STATUS_COLORS: Record<string, string> = {
  active: DS.green,
  pending_approval: DS.amber,
  paused: DS.text4,
  completed: DS.cosmicBlue,
  cancelled: DS.red,
};

const TYPE_LABELS: Record<IntakeType, string> = {
  external: "Ký HĐ ngoài",
  sales_assisted: "Sales mua hộ",
};

// ── Shared Styles ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: DS.bgCard2,
  border: `1px solid ${DS.border}`,
  borderRadius: 8,
  padding: "9px 12px",
  color: DS.text,
  fontSize: 13,
  outline: "none",
  fontFamily: DS.body,
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  color: DS.text4,
  fontSize: 10,
  fontFamily: DS.mono,
  display: "block" as const,
  marginBottom: 5,
  letterSpacing: "0.1em",
};

const cardStyle: React.CSSProperties = {
  background: DS.bgCard,
  border: `1px solid ${DS.border}`,
  borderRadius: 12,
  padding: "16px 20px",
};

// ── Intake Form Modal ─────────────────────────────────────────────────────────

function IntakeFormModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const qc = useQueryClient();

  // Mode toggle
  const [intakeType, setIntakeType] = useState<IntakeType>("external");

  // Customer
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [requirements, setRequirements] = useState("");

  // External contract
  const [contractRef, setContractRef] = useState("");
  const [contractParty, setContractParty] = useState("");
  const [signedAt, setSignedAt] = useState("");

  // Pricing
  const [totalAmount, setTotalAmount] = useState("");
  const [activateKanban, setActivateKanban] = useState(true);
  const [startedAt, setStartedAt] = useState("");

  // Team
  const [pmId, setPmId] = useState("");
  const [pmLp, setPmLp] = useState("");
  const [teamRows, setTeamRows] = useState<Array<{ memberId: string; roleKey: string; assignedLp: string }>>([]);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Fetch team members for dropdown ──
  const { data: membersData } = useQuery({
    queryKey: ["admin", "team-members-simple"],
    queryFn: () =>
      adminApi.get<Array<{ id: string; name: string; rank: string; image?: string }>>(
        "/api/admin/team",
        { params: { page: 1, limit: 100 } }
      ),
  });

  const members: TeamMemberOption[] = membersData ?? [];

  // Available members (not already assigned as PM)
  const availableForTeam = members.filter((m) => m.id !== pmId);

  // ── Add team row ──
  const addTeamRow = () => {
    setTeamRows((r) => [...r, { memberId: "", roleKey: "dev", assignedLp: "" }]);
  };

  const removeTeamRow = (idx: number) => {
    setTeamRows((r) => r.filter((_, i) => i !== idx));
  };

  const updateTeamRow = (idx: number, patch: Partial<typeof teamRows[0]>) => {
    setTeamRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  // ── Set defaults based on type ──
  const handleTypeChange = (type: IntakeType) => {
    setIntakeType(type);
    setActivateKanban(type === "external");
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!customerName.trim()) { setError("Tên khách hàng là bắt buộc."); return; }
    if (!customerEmail.trim()) { setError("Email là bắt buộc."); return; }
    if (intakeType === "sales_assisted" && (!totalAmount || Number(totalAmount) <= 0)) {
      setError("Giá VND là bắt buộc cho Sales mua hộ."); return;
    }

    const teamMembers = teamRows
      .filter((r) => r.memberId && r.roleKey)
      .map((r) => ({
        memberId: r.memberId,
        roleKey: r.roleKey,
        assignedLp: r.assignedLp ? parseInt(r.assignedLp) : undefined,
      }));

    const payload: IntakePayload = {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim() || undefined,
      companyName: companyName.trim() || undefined,
      requirements: requirements.trim() || undefined,
      type: intakeType,
      contractRef: contractRef.trim() || undefined,
      contractParty: contractParty.trim() || undefined,
      signedAt: signedAt || undefined,
      totalAmount: totalAmount ? parseFloat(totalAmount) : undefined,
      pmMemberId: pmId || undefined,
      teamMembers: teamMembers.length > 0 ? teamMembers : undefined,
      activateKanban,
      startedAt: startedAt || undefined,
    };

    setSaving(true);
    try {
      const res = await adminApi.post<{
        data: {
          order: { id: string; isActiveProject: boolean; orderNumber: string };
          externalProject: { id: string };
        };
      }>("/api/admin/project-intake", payload);

      qc.invalidateQueries({ queryKey: ["admin", "project-intake"] });
      onClose();

      const { order } = res.data;
      if (order.isActiveProject) {
        router.push(`/admin/projects/${order.id}/kanban`);
      } else {
        router.push(`/admin/orders/${order.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Tạo thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(2,6,23,0.88)",
        backdropFilter: "blur(10px)", zIndex: 60, display: "flex",
        alignItems: "flex-start", justifyContent: "center",
        padding: "24px 16px", overflowY: "auto",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: DS.bg, border: `1px solid ${DS.border}`,
          borderRadius: 16, padding: "28px 28px 24px",
          width: "100%", maxWidth: 680,
          marginTop: 8, marginBottom: 24,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: DS.heading, fontSize: 18, color: DS.text, margin: "0 0 4px" }}>
              Tiếp nhận dự án mới
            </h2>
            <p style={{ fontSize: 12, color: DS.text4, margin: 0 }}>
              Tạo Order + kích hoạt Kanban tức thì
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer", color: DS.text4,
              padding: 4, borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ── Mode toggle ── */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {(["external", "sales_assisted"] as IntakeType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                style={{
                  flex: 1, padding: "10px 16px", borderRadius: 10, border: "none",
                  cursor: "pointer", fontFamily: DS.body, fontSize: 13, fontWeight: 600,
                  transition: "all 0.15s",
                  background: intakeType === type
                    ? "linear-gradient(135deg, #EC4899, #6B3DF5)"
                    : DS.bgCard2,
                  color: intakeType === type ? "#fff" : DS.text3,
                  boxShadow: intakeType === type ? `0 0 16px rgba(236,72,153,0.35)` : "none",
                }}
              >
                {type === "external" ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                    <FolderKanban size={14} />
                    Ký HĐ bên ngoài
                  </span>
                ) : (
                  <span style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                    <ShoppingCart size={14} />
                    Sales mua hộ KH
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Customer info ── */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ ...labelStyle, marginBottom: 10 }}>THÔNG TIN KHÁCH HÀNG</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>TÊN KHÁCH HÀNG *</label>
                <input
                  value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>EMAIL *</label>
                <input
                  value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="khachhang@email.com"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>SĐT</label>
                <input
                  value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0901 234 567"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>CÔNG TY</label>
                <input
                  value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Công ty ABC"
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>YÊU CẦU / MÔ TẢ</label>
              <textarea
                value={requirements} onChange={(e) => setRequirements(e.target.value)}
                placeholder="Mô tả ngắn về dự án..."
                rows={2}
                style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
              />
            </div>
          </div>

          {/* ── External contract info ── */}
          {intakeType === "external" && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ ...labelStyle, marginBottom: 10 }}>HỢP ĐỒNG BÊN NGOÀI</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>SỐ HĐ</label>
                  <input
                    value={contractRef} onChange={(e) => setContractRef(e.target.value)}
                    placeholder="HĐ-2026-001"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>BÊN KÝ</label>
                  <input
                    value={contractParty} onChange={(e) => setContractParty(e.target.value)}
                    placeholder="Tên công ty"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>NGÀY KÝ</label>
                  <input
                    type="date"
                    value={signedAt} onChange={(e) => setSignedAt(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={labelStyle}>TỔNG GIÁ TRỊ (VNĐ) — TÙY CHỌN</label>
                <input
                  type="number"
                  value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="Bỏ trống = chưa xác định giá"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* ── Pricing (sales_assisted) ── */}
          {intakeType === "sales_assisted" && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ ...labelStyle, marginBottom: 10 }}>THANH TOÁN</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>TỔNG GIÁ TRỊ (VNĐ) *</label>
                  <input
                    type="number"
                    value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="15,000,000"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>NGÀY BẮT ĐẦU</label>
                  <input
                    type="date"
                    value={startedAt} onChange={(e) => setStartedAt(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Team ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ ...labelStyle, marginBottom: 0 }}>PHÂN CÔNG TEAM</p>
              <button
                type="button"
                onClick={addTeamRow}
                style={{
                  background: "none", border: `1px solid ${DS.border}`, borderRadius: 6,
                  padding: "4px 10px", cursor: "pointer", color: DS.text3, fontSize: 12,
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <Plus size={12} /> Thêm thành viên
              </button>
            </div>

            {/* PM row */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div>
                <label style={labelStyle}>PROJECT MANAGER</label>
                <select
                  value={pmId}
                  onChange={(e) => setPmId(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">— Chọn PM —</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.rank})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>LP NGÂN SÁCH</label>
                <input
                  type="number"
                  value={pmLp}
                  onChange={(e) => setPmLp(e.target.value)}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>KÍCH HOẠT KANBAN</label>
                <div style={{ display: "flex", alignItems: "center", height: "100%", paddingTop: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={activateKanban}
                      onChange={(e) => setActivateKanban(e.target.checked)}
                    />
                    <span style={{ color: DS.text3, fontSize: 12 }}>Kích hoạt</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Additional team rows */}
            {teamRows.map((row, idx) => (
              <div
                key={idx}
                style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "center" }}
              >
                <select
                  value={row.memberId}
                  onChange={(e) => updateTeamRow(idx, { memberId: e.target.value })}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">— Chọn thành viên —</option>
                  {availableForTeam
                    .filter((m) => !teamRows.some((r, i) => i !== idx && r.memberId === m.id))
                    .map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.rank})</option>
                    ))}
                </select>
                <select
                  value={row.roleKey}
                  onChange={(e) => updateTeamRow(idx, { roleKey: e.target.value })}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={row.assignedLp}
                  onChange={(e) => updateTeamRow(idx, { assignedLp: e.target.value })}
                  placeholder="LP"
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => removeTeamRow(idx)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: DS.text4, padding: 4 }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}

            {teamRows.length === 0 && (
              <p style={{ color: DS.text4, fontSize: 12, margin: "4px 0 0" }}>
                Chưa có thành viên nào. Thêm PM hoặc thành viên khác.
              </p>
            )}
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{
              background: "rgba(204,51,68,0.12)", border: `1px solid ${DS.red}`,
              borderRadius: 8, padding: "10px 14px", marginBottom: 16,
              display: "flex", gap: 8, alignItems: "center",
            }}>
              <AlertCircle size={14} style={{ color: DS.red, flexShrink: 0 }} />
              <span style={{ color: DS.red, fontSize: 12 }}>{error}</span>
            </div>
          )}

          {/* ── Submit ── */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 20px", borderRadius: 10, border: `1px solid ${DS.border}`,
                background: "transparent", color: DS.text3, cursor: "pointer",
                fontFamily: DS.body, fontSize: 13,
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px 24px", borderRadius: 10, border: "none",
                background: saving ? DS.text4 : "linear-gradient(135deg, #EC4899, #6B3DF5)",
                color: "#fff", cursor: saving ? "not-allowed" : "pointer",
                fontFamily: DS.body, fontSize: 13, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 8,
                boxShadow: saving ? "none" : `0 0 20px rgba(236,72,153,0.4)`,
              }}
            >
              {saving ? "Đang tạo..." : "Tạo dự án"}
              {!saving && <ArrowRight size={14} />}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── External Project Card ───────────────────────────────────────────────────────

function ProjectCard({ project }: { project: ExternalProject }) {
  const [open, setOpen] = useState(false);

  const statusColor = STATUS_COLORS[project.status] ?? DS.text4;
  const order = project.order;

  return (
    <>
      <motion.div
        whileHover={{ borderColor: DS.pink }}
        onClick={() => setOpen(true)}
        style={{
          ...cardStyle, cursor: "pointer", transition: "border-color 0.15s",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{
                background: `rgba(236,72,153,0.12)`,
                color: DS.pink, fontSize: 10, fontFamily: DS.mono,
                padding: "2px 8px", borderRadius: 4,
              }}>
                {TYPE_LABELS[project.type]}
              </span>
              <span style={{ color: DS.text4, fontSize: 11 }}>
                {new Date(project.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <p style={{ fontFamily: DS.heading, fontSize: 14, color: DS.text, margin: 0, fontWeight: 600 }}>
              {project.customerName}
            </p>
            <p style={{ color: DS.text4, fontSize: 12, margin: "2px 0 0" }}>
              {project.customerEmail}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: DS.amber,
              fontFamily: DS.mono,
            }}>
              {fmtVND(project.totalAmount)}
            </div>
            <div style={{
              fontSize: 10, color: statusColor, marginTop: 3,
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              {project.status.replace("_", " ")}
            </div>
          </div>
        </div>

        {/* Contract info */}
        {project.contractRef && (
          <div style={{ fontSize: 11, color: DS.text4, marginBottom: 6 }}>
            HĐ: <span style={{ color: DS.text3 }}>{project.contractRef}</span>
            {project.contractParty && <> · <span style={{ color: DS.text3 }}>{project.contractParty}</span></>}
          </div>
        )}

        {/* Order info */}
        {order && (
          <div style={{
            background: DS.bgCard2, borderRadius: 8, padding: "8px 10px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>{order.orderNumber}</span>
              {order.isActiveProject && (
                <span style={{
                  marginLeft: 8, background: "rgba(34,197,94,0.12)",
                  color: DS.green, fontSize: 10, padding: "1px 6px", borderRadius: 3,
                }}>
                  Kanban active
                </span>
              )}
            </div>
            {order.isActiveProject ? (
              <a
                href={`/admin/projects/${order.id}/kanban`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: 11, color: DS.pink, textDecoration: "none",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                Mở Kanban <ArrowRight size={11} />
              </a>
            ) : (
              <a
                href={`/admin/orders/${order.id}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontSize: 11, color: DS.text3, textDecoration: "none",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                Xem Order <ArrowRight size={11} />
              </a>
            )}
          </div>
        )}
      </motion.div>

      {/* Order detail panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, background: "rgba(2,6,23,0.6)",
              backdropFilter: "blur(6px)", zIndex: 50, display: "flex",
              alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: DS.bg, border: `1px solid ${DS.border}`,
                borderBottom: "none", borderRadius: "16px 16px 0 0",
                padding: "24px 24px 32px", width: "100%", maxWidth: 480,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ fontFamily: DS.heading, fontSize: 15, color: DS.text, margin: 0 }}>
                  {project.customerName}
                </h3>
                <button
                  onClick={() => setOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: DS.text4 }}
                >
                  <X size={16} />
                </button>
              </div>

              {order && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                  {[
                    ["Order", order.orderNumber],
                    ["Trạng thái", order.status],
                    ["Thanh toán", order.paymentStatus],
                    ["Kanban", order.isActiveProject ? "Active" : "Inactive"],
                    ["Ngày bắt đầu", order.startedAt ? new Date(order.startedAt).toLocaleDateString("vi-VN") : "—"],
                    ["Giá trị", fmtVND(order.totalAmount)],
                  ].map(([label, value]) => (
                    <div key={label} style={{ background: DS.bgCard2, borderRadius: 8, padding: "8px 10px" }}>
                      <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>{label}</div>
                      <div style={{ color: DS.text, fontSize: 12, marginTop: 2, textTransform: "capitalize" }}>{value}</div>
                    </div>
                  ))}
                </div>
              )}

              {project.contractRef && (
                <div style={{ fontSize: 12, color: DS.text3 }}>
                  HĐ: <span style={{ color: DS.text }}>{project.contractRef}</span>
                  {project.contractParty && <> · Bên ký: <span style={{ color: DS.text }}>{project.contractParty}</span></>}
                </div>
              )}

              <a
                href={project.order?.isActiveProject ? `/admin/projects/${project.order.id}/kanban` : `/admin/orders/${project.order?.id}`}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  marginTop: 16, padding: "11px", borderRadius: 10,
                  background: "linear-gradient(135deg, #EC4899, #6B3DF5)",
                  color: "#fff", fontFamily: DS.body, fontSize: 13, fontWeight: 600,
                  textDecoration: "none", boxShadow: `0 0 20px rgba(236,72,153,0.35)`,
                }}
              >
                {order?.isActiveProject ? "Mở Kanban" : "Mở Order"} <ArrowRight size={14} />
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProjectIntakePage() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "project-intake", { search, type: typeFilter, status: statusFilter }],
    queryFn: () =>
      adminApi.get<{
        data: ExternalProject[];
        pagination: { total: number; page: number; limit: number; totalPages: number };
      }>("/api/admin/project-intake", {
        params: {
          page: 1, limit: 20,
          ...(search ? { search } : {}),
          ...(typeFilter ? { type: typeFilter } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
        },
      }),
  });

  // adminApi wraps in { data: ... } — GET /project-intake returns { data, pagination }
  const payload = data?.data as { data: ExternalProject[]; pagination: { total: number; page: number; limit: number; totalPages: number } } | undefined;
  const projects = payload?.data ?? [];
  const pagination = payload?.pagination;

  return (
    <div style={{ padding: "28px 28px 40px", maxWidth: 1100 }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: DS.heading, fontSize: 22, color: DS.text, margin: "0 0 4px" }}>
            Tiếp nhận dự án
          </h1>
          <p style={{ color: DS.text4, fontSize: 13, margin: 0 }}>
            External project intake — ký HĐ bên ngoài hoặc Sales mua hộ
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: "10px 20px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #EC4899, #6B3DF5)",
            color: "#fff", cursor: "pointer", fontFamily: DS.body, fontSize: 13, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: `0 0 20px rgba(236,72,153,0.35)`,
          }}
        >
          <Plus size={16} /> Tạo dự án mới
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên, email, số HĐ..."
            style={{
              ...inputStyle, paddingLeft: 32,
            }}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ ...inputStyle, width: "auto", cursor: "pointer", minWidth: 140 }}
        >
          <option value="">Tất cả loại</option>
          <option value="external">Ký HĐ ngoài</option>
          <option value="sales_assisted">Sales mua hộ</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ ...inputStyle, width: "auto", cursor: "pointer", minWidth: 140 }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Active</option>
          <option value="pending_approval">Chờ duyệt</option>
          <option value="completed">Hoàn thành</option>
          <option value="paused">Tạm dừng</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {/* ── List ── */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: DS.text4, fontSize: 13 }}>
          Đang tải...
        </div>
      ) : projects.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "60px 0", color: DS.text4,
          border: `1px dashed ${DS.border}`, borderRadius: 12,
        }}>
          <CheckCircle2 size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 14, margin: "0 0 4px" }}>Chưa có dự án nào</p>
          <p style={{ fontSize: 12, margin: 0 }}>Tạo dự án mới bằng nút trên</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
          {pagination && pagination.totalPages > 1 && (
            <div style={{ textAlign: "center", marginTop: 20, color: DS.text4, fontSize: 12 }}>
              Trang {pagination.page} / {pagination.totalPages} — {pagination.total} dự án
            </div>
          )}
        </>
      )}

      {/* ── Form Modal ── */}
      <AnimatePresence>
        {showForm && <IntakeFormModal onClose={() => setShowForm(false)} />}
      </AnimatePresence>
    </div>
  );
}
