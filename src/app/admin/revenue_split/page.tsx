"use client";

/**
 * Revenue Split Config Admin Page
 * Route: /admin/revenue_split
 * CRUD for RevenueSplitConfig — percentage per role used by OffSystemPayment auto-split.
 */

import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { X, Plus, Edit2, Trash2, Save, AlertTriangle, Calculator } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RevenueSplitConfig {
  id: string;
  key: string;
  label: string;
  percentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SplitFormData {
  key: string;
  label: string;
  percentage: number;
  isActive: boolean;
}

// ── Init seed data ────────────────────────────────────────────────────────────

const INIT_CONFIGS: RevenueSplitConfig[] = [
  { id: "seed-pm",      key: "pm",      label: "Project Manager", percentage: 35, isActive: true, createdAt: "", updatedAt: "" },
  { id: "seed-dev",     key: "dev",     label: "Developer",        percentage: 25, isActive: true, createdAt: "", updatedAt: "" },
  { id: "seed-qa",      key: "qa",      label: "QA Engineer",     percentage: 15, isActive: true, createdAt: "", updatedAt: "" },
  { id: "seed-design",  key: "design",  label: "Designer",         percentage: 15, isActive: true, createdAt: "", updatedAt: "" },
  { id: "seed-seo",     key: "seo",     label: "SEO Specialist",  percentage: 10, isActive: true, createdAt: "", updatedAt: "" },
  { id: "seed-company", key: "company", label: "Công ty",          percentage: 0,  isActive: true, createdAt: "", updatedAt: "" },
];

// ── Preview helpers ───────────────────────────────────────────────────────────

const fmtVND = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);
const fmtLP = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M LP` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K LP` : `${n} LP`;

// ── Config Form Modal ─────────────────────────────────────────────────────────

function ConfigModal({
  config,
  onClose,
  onSave,
  existingKeys,
}: {
  config?: RevenueSplitConfig;
  onClose: () => void;
  onSave: (data: SplitFormData, id?: string) => void;
  existingKeys: string[];
}) {
  const [key, setKey] = useState(config?.key ?? "");
  const [label, setLabel] = useState(config?.label ?? "");
  const [percentage, setPercentage] = useState(config?.percentage ?? 0);
  const [isActive, setIsActive] = useState(config?.isActive ?? true);
  const [error, setError] = useState("");

  const isEdit = !!config;

  const handleSave = () => {
    if (!key.trim()) { setError("Key không được để trống"); return; }
    if (!label.trim()) { setError("Label không được để trống"); return; }
    if (percentage < 0 || percentage > 100) { setError("Phần trăm phải từ 0 đến 100"); return; }
    if (!isEdit && existingKeys.includes(key.trim())) { setError(`Key "${key}" đã tồn tại`); return; }
    onSave({ key: key.trim(), label: label.trim(), percentage, isActive }, config?.id);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: DS.bgCard2, border: `1px solid ${DS.border}`,
    borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none",
    fontFamily: DS.body, boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block" as const,
    marginBottom: 5, letterSpacing: "0.1em",
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
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, width: "100%", maxWidth: 440, overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: `1px solid ${DS.border}` }}>
          <div>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.15em" }}>── CẤU HÌNH CHIA DOANH THU</div>
            <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginTop: 2 }}>{isEdit ? "Sửa Role" : "Thêm Role"}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
        </div>

        <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 14 }}>
          {!isEdit && (
            <div>
              <label style={labelStyle}>KEY (slug, không trùng)</label>
              <input value={key} onChange={(e) => setKey(e.target.value.toLowerCase().replace(/\s/g, "_"))}
                placeholder="VD: pm, dev, qa"
                style={{ ...inputStyle, fontFamily: DS.mono }} />
            </div>
          )}
          {isEdit && (
            <div>
              <label style={labelStyle}>KEY</label>
              <div style={{ ...inputStyle, color: DS.text4, fontFamily: DS.mono, cursor: "not-allowed" }}>{key}</div>
            </div>
          )}
          <div>
            <label style={labelStyle}>TÊN HIỂN THỊ</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder="VD: Project Manager" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>PHẦN TRĂM (%)</label>
            <input type="number" value={percentage} onChange={(e) => setPercentage(Number(e.target.value))}
              min={0} max={100} step={0.5}
              style={{ ...inputStyle, color: DS.blue, fontFamily: DS.mono }} />
          </div>
          <div>
            <label style={{ ...labelStyle, cursor: "pointer", userSelect: "none" }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                style={{ marginRight: 8, accentColor: DS.pink }} />
              Đang hoạt động
            </label>
          </div>
          {error && (
            <div style={{ color: DS.red, fontSize: 11, background: `${DS.red}10`, border: `1px solid ${DS.red}25`, borderRadius: 8, padding: "8px 12px" }}>
              <AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />
              {error}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, padding: "1.25rem 1.5rem", borderTop: `1px solid ${DS.border}`, flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ flex: 1, background: "none", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px", color: DS.text3, cursor: "pointer", fontSize: 13 }}>
            Hủy
          </button>
          <button onClick={handleSave}
            style={{ flex: 2, background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, padding: "10px", cursor: "pointer", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Save size={13} /> {isEdit ? "Cập nhật" : "Tạo mới"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Preview Modal ──────────────────────────────────────────────────────────────

function PreviewModal({
  configs,
  onClose,
}: {
  configs: RevenueSplitConfig[];
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(3_000_000);
  const [lpRate, setLpRate] = useState(1_000);
  const inputStyle: React.CSSProperties = {
    width: "100%", background: DS.bgCard2, border: `1px solid ${DS.border}`,
    borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 14, outline: "none",
    fontFamily: DS.mono, boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block" as const,
    marginBottom: 5, letterSpacing: "0.1em",
  };

  const totalLp = Math.floor(amount / lpRate);
  const activeConfigs = configs.filter(c => c.isActive && c.key !== "company" && c.percentage > 0);
  const rows = activeConfigs.map(c => ({
    ...c,
    vnd: Math.floor((amount * c.percentage) / 100),
    lp: Math.floor((totalLp * c.percentage) / 100),
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.88)", backdropFilter: "blur(10px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, width: "100%", maxWidth: 540, overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: `1px solid ${DS.border}` }}>
          <div>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.15em" }}>── PREVIEW CHIA LP</div>
            <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginTop: 2 }}>Xem trước quy đổi</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
        </div>

        <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>SỐ TIỀN (VNĐ)</label>
              <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))}
                style={{ ...inputStyle, color: DS.pink }} />
            </div>
            <div>
              <label style={labelStyle}>TỶ GIÁ (1 LP = ? VND)</label>
              <input type="number" value={lpRate} onChange={e => setLpRate(Number(e.target.value))}
                style={{ ...inputStyle, color: DS.green }} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, padding: "8px 12px", borderRadius: 12, background: `${DS.purple}10`, border: `1px solid ${DS.purple}25` }}>
            <span style={{ color: DS.text3, fontSize: 11 }}>Quy đổi:</span>
            <span style={{ color: DS.pink, fontFamily: DS.mono, fontWeight: 700 }}>{fmtLP(totalLp)}</span>
            <span style={{ color: DS.text5, fontSize: 11 }}>(≈ {fmtVND(totalLp * lpRate)} VND)</span>
          </div>

          <div style={{ background: DS.bgCard2, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 100px 90px", padding: "10px 14px", borderBottom: `1px solid ${DS.border}` }}>
              {["Role", "%", "VNĐ", "LP"].map(h => (
                <div key={h} style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.1em" }}>{h}</div>
              ))}
            </div>
            {rows.map(r => (
              <div key={r.key} style={{ display: "grid", gridTemplateColumns: "1fr 60px 100px 90px", padding: "10px 14px", borderBottom: `1px solid ${DS.border}` }}>
                <div style={{ color: DS.text2, fontSize: 12 }}>{r.label}</div>
                <div style={{ color: DS.amber, fontFamily: DS.mono, fontSize: 12 }}>{r.percentage}%</div>
                <div style={{ color: DS.text3, fontFamily: DS.mono, fontSize: 12 }}>{r.vnd.toLocaleString("vi-VN")}</div>
                <div style={{ color: DS.green, fontFamily: DS.mono, fontSize: 12, fontWeight: 700, textAlign: "right" }}>{fmtLP(r.lp)}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "1rem 1.5rem", borderTop: `1px solid ${DS.border}`, flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ width: "100%", background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px", color: DS.text3, cursor: "pointer", fontSize: 13 }}>
            Đóng
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function RevenueSplitPage() {
  const [configs, setConfigs] = useState<RevenueSplitConfig[]>(INIT_CONFIGS);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<RevenueSplitConfig | undefined>();
  const [showPreview, setShowPreview] = useState(false);
  const qc = useQueryClient();

  const { data: apiData, isLoading } = useQuery({
    queryKey: ["admin", "revenue-split-configs"],
    queryFn: () => adminApi.get<{ data: RevenueSplitConfig[] }>("/api/admin/revenue-split-configs"),
  });

  // Sync from API
  const displayConfigs = (apiData?.data?.length ?? 0) > 0 ? apiData!.data : configs;
  const existingKeys = displayConfigs.map(c => c.key);

  const createMutation = useMutation({
    mutationFn: (data: SplitFormData) =>
      adminApi.post("/api/admin/revenue-split-configs", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "revenue-split-configs"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SplitFormData }) =>
      adminApi.patch(`/api/admin/revenue-split-configs/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "revenue-split-configs"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      adminApi.delete(`/api/admin/revenue-split-configs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "revenue-split-configs"] }),
  });

  const handleSave = (data: SplitFormData, id?: string) => {
    if (id) {
      updateMutation.mutate({ id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const totalPct = displayConfigs.reduce((s, c) => s + (c.isActive ? c.percentage : 0), 0);
  const isOver = totalPct > 100;
  const isUnder = totalPct < 100 && totalPct > 0;

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", background: DS.bgCosmic ?? "var(--figma-bg-cosmic, #09090b)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Cấu hình chia doanh thu
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            Tỷ lệ % LP chia cho từng role khi nhập chi phí ngoài hệ thống
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowPreview(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}>
            <Calculator size={13} /> Preview
          </button>
          <button onClick={() => { setEditingConfig(undefined); setShowForm(true); }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: DS.mono, boxShadow: "0 0 16px rgba(129,140,248,0.3)" }}>
            <Plus size={13} /> Thêm Role
          </button>
        </div>
      </div>

      {/* Total % bar */}
      <div style={{ marginBottom: "1.25rem", padding: "12px 16px", borderRadius: 14, background: DS.bgCard, border: `1px solid ${isOver ? DS.red + "40" : isUnder ? DS.amber + "40" : DS.green + "40"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono }}>TỔNG % ĐANG HOẠT ĐỘNG</span>
          <span style={{ color: isOver ? DS.red : isUnder ? DS.amber : DS.green, fontFamily: DS.mono, fontSize: 14, fontWeight: 700 }}>
            {totalPct.toFixed(1)}% {isOver ? "⚠️ Vượt 100%" : isUnder ? "⚠️ Chưa đủ 100%" : "✓ OK"}
          </span>
        </div>
        <div style={{ height: 6, background: DS.border, borderRadius: 99, overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(totalPct, 100)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ height: "100%", background: isOver ? DS.red : isUnder ? DS.amber : DS.green, borderRadius: 99 }}
          />
        </div>
        {isOver && (
          <div style={{ color: DS.red, fontSize: 10, marginTop: 6, fontFamily: DS.mono }}>
            Tổng vượt 100% — vui lòng giảm % các role để tránh trùng lặp LP
          </div>
        )}
      </div>

      {/* Config table */}
      <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 100px 80px 100px", padding: "10px 18px", borderBottom: `1px solid ${DS.border}` }}>
              {["Key", "Tên hiển thị", "Phần trăm", "Trạng thái", "Thao tác"].map(h => (
                <div key={h} style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.1em" }}>{h}</div>
              ))}
            </div>
            {displayConfigs.map((cfg, i) => (
              <div key={cfg.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr 100px 80px 100px", padding: "12px 18px", alignItems: "center", borderBottom: i < displayConfigs.length - 1 ? `1px solid ${DS.border}` : "none" }}>
                <div style={{ color: DS.cosmicCyan, fontFamily: DS.mono, fontSize: 12, fontWeight: 700 }}>{cfg.key}</div>
                <div style={{ color: DS.text2, fontSize: 13 }}>{cfg.label}</div>
                <div style={{ color: DS.amber, fontFamily: DS.mono, fontSize: 14, fontWeight: 700 }}>{cfg.percentage}%</div>
                <div>
                  <span style={{
                    padding: "3px 10px", borderRadius: 99, fontSize: 10, fontFamily: DS.mono,
                    background: cfg.isActive ? `${DS.green}15` : `${DS.text5}15`,
                    color: cfg.isActive ? DS.green : DS.text5,
                    border: `1px solid ${cfg.isActive ? DS.green + "30" : DS.border}`,
                  }}>
                    {cfg.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => { setEditingConfig(cfg); setShowForm(true); }}
                    style={{ background: `${DS.blue}12`, border: `1px solid ${DS.blue}25`, borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: DS.blue, display: "flex", alignItems: "center" }}>
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => { if (confirm(`Xóa role "${cfg.label}"?`)) deleteMutation.mutate(cfg.id); }}
                    style={{ background: `${DS.red}12`, border: `1px solid ${DS.red}25`, borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: DS.red, display: "flex", alignItems: "center" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showForm && (
          <ConfigModal
            config={editingConfig}
            onClose={() => { setShowForm(false); setEditingConfig(undefined); }}
            onSave={handleSave}
            existingKeys={existingKeys}
          />
        )}
        {showPreview && (
          <PreviewModal configs={displayConfigs} onClose={() => setShowPreview(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}