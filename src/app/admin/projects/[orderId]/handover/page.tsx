"use client";

/**
 * Handover Package Detail — Admin View
 * Route: /admin/projects/[orderId]/handover
 *
 * Manage handover checklist, links, notes, and status for a completed/active project.
 */
import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  ChevronRight, Package, ExternalLink, CheckCircle2,
  Clock, Edit2, Plus, Trash2, X, GitBranch, Globe, Shield,
  AlertCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type HandoverItem = {
  key: string;
  label: string;
  checked: boolean;
  notes?: string;
};

type HandoverPackage = {
  id: string;
  projectId: string;
  status: "draft" | "pending_review" | "approved" | "handed_over";
  handoverDate?: string | null;
  figmaUrl?: string | null;
  githubUrl?: string | null;
  deploymentUrl?: string | null;
  scope?: string | null;         // JSON string: { features: string[], pointCount: number, customRequests: string[] }
  notes?: string | null;
  adminNotes?: string | null;
  customerNotes?: string | null;
  deliveredBy?: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail?: string;
    status: string;
  };
};

type ScopeData = {
  features: string[];
  pointCount: number;
  customRequests: string[];
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft:         { label: "Bản nháp",    color: DS.text4, bg: "rgba(148,163,184,0.1)", icon: <Edit2 size={11} /> },
  pending_review:{ label: "Chờ duyệt",   color: DS.amber,  bg: "rgba(245,158,11,0.1)",  icon: <Clock size={11} /> },
  approved:      { label: "Đã duyệt",   color: DS.blue,   bg: "rgba(59,130,246,0.1)", icon: <CheckCircle2 size={11} /> },
  handed_over:   { label: "Đã bàn giao", color: DS.green,  bg: "rgba(34,197,94,0.1)", icon: <Package size={11} /> },
};

const parseScope = (scope: string | undefined): ScopeData => {
  if (!scope) return { features: [], pointCount: 0, customRequests: [] };
  try { return JSON.parse(scope); } catch { return { features: [], pointCount: 0, customRequests: [] }; }
};

const inpStyle: React.CSSProperties = {
  width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
  borderRadius: 10, padding: "9px 12px", color: DS.text, fontSize: 13,
  outline: "none", boxSizing: "border-box", fontFamily: DS.body,
};

// ── Checklist Editor ────────────────────────────────────────────────────────────

function ChecklistEditor({
  items,
  onChange,
  readOnly,
}: {
  items: HandoverItem[];
  onChange: (items: HandoverItem[]) => void;
  readOnly?: boolean;
}) {
  const [newLabel, setNewLabel] = useState("");

  const addItem = () => {
    if (!newLabel.trim()) return;
    onChange([...items, { key: `item-${Date.now()}`, label: newLabel.trim(), checked: false }]);
    setNewLabel("");
  };

  const toggleItem = (key: string) => {
    onChange(items.map(it => it.key === key ? { ...it, checked: !it.checked } : it));
  };

  const removeItem = (key: string) => {
    onChange(items.filter(it => it.key !== key));
  };

  const updateNote = (key: string, notes: string) => {
    onChange(items.map(it => it.key === key ? { ...it, notes } : it));
  };

  const checkedCount = items.filter(it => it.checked).length;

  return (
    <div>
      {items.length > 0 && (
        <div className="mb-3">
          {/* Progress bar */}
          <div className="flex justify-between mb-1.5">
            <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
              HOÀN THÀNH
            </span>
            <span style={{ color: checkedCount === items.length ? DS.green : DS.text3, fontSize: 11, fontFamily: DS.mono }}>
              {checkedCount}/{items.length}
            </span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${items.length > 0 ? (checkedCount / items.length) * 100 : 0}%`,
              background: checkedCount === items.length ? DS.green : GRD.primary,
              borderRadius: 2,
              transition: "width 0.3s ease",
            }} />
          </div>
        </div>
      )}

      <div className="space-y-2 mb-3">
        {items.map(item => (
          <div key={item.key} className="flex items-start gap-2">
            {!readOnly && (
              <div
                onClick={() => toggleItem(item.key)}
                className="mt-0.5 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center cursor-pointer"
                style={{
                  background: item.checked ? DS.green : "transparent",
                  border: item.checked ? "none" : `1.5px solid ${DS.border}`,
                }}
              >
                {item.checked && <CheckCircle2 size={12} style={{ color: "#fff" }} />}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div style={{
                color: item.checked ? DS.text4 : DS.text,
                fontSize: 13,
                textDecoration: item.checked ? "line-through" : "none",
                cursor: readOnly ? "default" : "pointer",
              }}>
                {item.label}
              </div>
              {!readOnly && (
                <input
                  value={item.notes ?? ""}
                  onChange={e => updateNote(item.key, e.target.value)}
                  placeholder="Ghi chú..."
                  style={{
                    ...inpStyle,
                    marginTop: 4,
                    fontSize: 12,
                    padding: "5px 8px",
                    opacity: item.notes ? 1 : 0.5,
                  }}
                />
              )}
              {readOnly && item.notes && (
                <div style={{ color: DS.text4, fontSize: 11, marginTop: 2, fontStyle: "italic" }}>
                  {item.notes}
                </div>
              )}
            </div>
            {!readOnly && (
              <button
                onClick={() => removeItem(item.key)}
                className="flex-shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center cursor-pointer"
                style={{ background: "rgba(239,68,68,0.1)", color: DS.red }}
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="flex gap-2">
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addItem()}
            placeholder="+ Thêm item..."
            style={{ ...inpStyle, fontSize: 12 }}
          />
          <button
            onClick={addItem}
            style={{
              padding: "6px 12px", background: `${DS.blue}15`, border: `1px solid ${DS.blue}30`,
              borderRadius: 8, color: DS.blue, cursor: "pointer", fontSize: 12, fontFamily: DS.mono,
              flexShrink: 0,
            }}
          >
            <Plus size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Scope Editor ───────────────────────────────────────────────────────────────

function ScopeEditor({
  scope,
  onChange,
  readOnly,
}: {
  scope: ScopeData;
  onChange: (s: ScopeData) => void;
  readOnly?: boolean;
}) {
  const [newFeature, setNewFeature] = useState("");
  const [newRequest, setNewRequest] = useState("");

  const addFeature = () => {
    if (!newFeature.trim()) return;
    onChange({ ...scope, features: [...scope.features, newFeature.trim()] });
    setNewFeature("");
  };

  const addRequest = () => {
    if (!newRequest.trim()) return;
    onChange({ ...scope, customRequests: [...scope.customRequests, newRequest.trim()] });
    setNewRequest("");
  };

  const removeFeature = (i: number) =>
    onChange({ ...scope, features: scope.features.filter((_, idx) => idx !== i) });

  const removeRequest = (i: number) =>
    onChange({ ...scope, customRequests: scope.customRequests.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      {/* Features */}
      <div>
        <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginBottom: 6 }}>TÍNH NĂNG ĐÃ BÀN GIAO</div>
        <div className="space-y-1 mb-2">
          {scope.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 size={11} style={{ color: DS.green, flexShrink: 0 }} />
              <span style={{ color: DS.text3, fontSize: 12, flex: 1 }}>{f}</span>
              {!readOnly && (
                <button onClick={() => removeFeature(i)} style={{ background: "none", border: "none", color: DS.red, cursor: "pointer" }}>
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <input
              value={newFeature}
              onChange={e => setNewFeature(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addFeature()}
              placeholder="+ Thêm tính năng..."
              style={{ ...inpStyle, fontSize: 12 }}
            />
            <button onClick={addFeature} style={{ padding: "6px 10px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, color: DS.green, cursor: "pointer", flexShrink: 0 }}>
              <Plus size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Point count */}
      <div>
        <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginBottom: 6 }}>SỐ ĐIỂM THỰC HIỆN</div>
        <input
          type="number"
          value={scope.pointCount || ""}
          onChange={e => onChange({ ...scope, pointCount: parseInt(e.target.value) || 0 })}
          disabled={readOnly}
          style={{ ...inpStyle, fontFamily: DS.mono, maxWidth: 160 }}
        />
      </div>

      {/* Custom requests */}
      <div>
        <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginBottom: 6 }}>YÊU CẦU TÙY CHỈNH</div>
        <div className="space-y-1 mb-2">
          {scope.customRequests.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <AlertCircle size={11} style={{ color: DS.amber, flexShrink: 0 }} />
              <span style={{ color: DS.text3, fontSize: 12, flex: 1 }}>{r}</span>
              {!readOnly && (
                <button onClick={() => removeRequest(i)} style={{ background: "none", border: "none", color: DS.red, cursor: "pointer" }}>
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <input
              value={newRequest}
              onChange={e => setNewRequest(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addRequest()}
              placeholder="+ Thêm yêu cầu..."
              style={{ ...inpStyle, fontSize: 12 }}
            />
            <button onClick={addRequest} style={{ padding: "6px 10px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, color: DS.amber, cursor: "pointer", flexShrink: 0 }}>
              <Plus size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HandoverPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const qc = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Local editable state
  const [items, setItems] = useState<HandoverItem[]>([]);
  const [scope, setScope] = useState<ScopeData>({ features: [], pointCount: 0, customRequests: [] });
  const [figmaUrl, setFigmaUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [deploymentUrl, setDeploymentUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [status, setStatus] = useState<HandoverPackage["status"]>("draft");

  // Load handover package
  const { data, isLoading, error } = useQuery({
    queryKey: ["handover", orderId],
    queryFn: () =>
      adminApi.get(`/api/admin/orders/${orderId}/handover`).then((r: unknown) => {
        const res = r as { data: HandoverPackage };
        return res.data;
      }),
  });

  // Hydrate local state when data arrives
  useQuery({
    queryKey: ["handover", orderId],
    enabled: !!data,
    staleTime: 0,
  });

  const handover = data;

  // Sync local state from server data
  useQuery({
    queryKey: ["handover-sync", orderId, !!handover],
    enabled: !!handover,
    staleTime: Infinity,
  });

  // Sync when handover loads
  const syncFromHandover = (hp: HandoverPackage & { items?: unknown }) => {
    const itemsArr = Array.isArray(hp.items) ? hp.items as HandoverItem[] : [];
    setItems(itemsArr);
    setScope(parseScope(hp.scope ?? undefined));
    setFigmaUrl(hp.figmaUrl ?? "");
    setGithubUrl(hp.githubUrl ?? "");
    setDeploymentUrl(hp.deploymentUrl ?? "");
    setNotes(hp.notes ?? "");
    setAdminNotes(hp.adminNotes ?? "");
    setCustomerNotes(hp.customerNotes ?? "");
    setStatus(hp.status ?? "draft");
  };

  // Effect to sync when handover data loads
  const [hydrated, setHydrated] = useState(false);
  if (handover && !hydrated) {
    syncFromHandover(handover);
    setHydrated(true);
  }

  // Create/Upsert mutation
  const upsert = useMutation({
    mutationFn: (payload: {
      items: HandoverItem[];
      scope: ScopeData;
      figmaUrl: string;
      githubUrl: string;
      deploymentUrl: string;
      notes: string;
      adminNotes: string;
      customerNotes: string;
      status?: string;
    }) => {
      return adminApi.post(`/api/admin/orders/${orderId}/handover`, {
        ...(handover ? {} : {}), // upsert on BE side
        items: payload.items,
        scope: JSON.stringify(payload.scope),
        figmaUrl: payload.figmaUrl || undefined,
        githubUrl: payload.githubUrl || undefined,
        deploymentUrl: payload.deploymentUrl || undefined,
        notes: payload.notes || undefined,
        adminNotes: payload.adminNotes || undefined,
        customerNotes: payload.customerNotes || undefined,
        status: payload.status || (handover?.status ?? "draft"),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["handover", orderId] });
      setEditMode(false);
      setSaving(false);
      setSuccessMsg("Đã lưu thành công!");
      setTimeout(() => setSuccessMsg(""), 3000);
    },
    onError: (err: unknown) => {
      setSaveError(err instanceof Error ? err.message : "Lưu thất bại");
      setSaving(false);
    },
  });

  // Mark delivered mutation
  const markDelivered = useMutation({
    mutationFn: () =>
      adminApi.post(`/api/admin/orders/${orderId}/handover`, {
        status: "handed_over",
        handoverDate: new Date().toISOString(),
        items,
        scope: JSON.stringify(scope),
        figmaUrl: figmaUrl || undefined,
        githubUrl: githubUrl || undefined,
        deploymentUrl: deploymentUrl || undefined,
        notes: notes || undefined,
        adminNotes: adminNotes || undefined,
        customerNotes: customerNotes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["handover", orderId] });
      setSuccessMsg("Đã bàn giao thành công!");
      setTimeout(() => setSuccessMsg(""), 3000);
    },
    onError: (err: unknown) => {
      setSaveError(err instanceof Error ? err.message : "Bàn giao thất bại");
    },
  });

  const handleSave = () => {
    setSaving(true);
    setSaveError("");
    upsert.mutate({
      items,
      scope,
      figmaUrl,
      githubUrl,
      deploymentUrl,
      notes,
      adminNotes,
      customerNotes,
      status: handover?.status ?? "draft",
    });
  };

  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const checkedItems = items.filter(it => it.checked).length;
  const completionPct = items.length > 0 ? Math.round((checkedItems / items.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div style={{ width: 36, height: 36, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (error || (!handover && typeof data === "undefined")) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={40} style={{ color: DS.red, margin: "0 auto 12px" }} />
        <div style={{ color: DS.text3, fontSize: 14 }}>Không tải được handover package</div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-5" style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
        <a href="/admin/projects" style={{ color: DS.blue, textDecoration: "none" }}>Projects</a>
        <ChevronRight size={12} />
        <span style={{ color: DS.text4 }}>{handover?.project?.orderNumber ?? orderId}</span>
        <ChevronRight size={12} />
        <span style={{ color: DS.text }}>Bàn giao</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 style={{ fontFamily: DS.heading, fontSize: 22, fontWeight: 900, color: DS.text, marginBottom: 4 }}>
            Gói Bàn Giao
          </h1>
          <div style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
            {handover?.project?.orderNumber} · {handover?.project?.customerName ?? "—"}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Status badge */}
          <span className="px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-mono font-bold"
            style={{ background: statusCfg.bg, color: statusCfg.color }}>
            {statusCfg.icon} {statusCfg.label}
          </span>

          {status !== "handed_over" && !editMode && (
            <button
              onClick={() => setEditMode(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: `${DS.blue}15`, border: `1px solid ${DS.blue}30`, borderRadius: 10, color: DS.blue, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
            >
              <Edit2 size={12} /> Chỉnh sửa
            </button>
          )}

          {status !== "handed_over" && editMode && (
            <>
              <button
                onClick={() => { setEditMode(false); setHydrated(false); }}
                style={{ padding: "8px 16px", background: "none", border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: saving ? DS.text4 : GRD.primary, border: "none", borderRadius: 10, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 700, fontFamily: DS.mono, boxShadow: saving ? "none" : "0 0 16px rgba(129,140,248,0.3)" }}
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </>
          )}

          {status !== "handed_over" && (
            <button
              onClick={() => markDelivered.mutate()}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, color: DS.green, cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: DS.mono }}
            >
              <Package size={12} /> Bàn giao cho khách
            </button>
          )}
        </div>
      </div>

      {/* Feedback */}
      {successMsg && (
        <div className="mb-4 p-3 rounded-xl flex items-center gap-2"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: DS.green, fontSize: 13 }}>
          <CheckCircle2 size={14} /> {successMsg}
        </div>
      )}
      {saveError && (
        <div className="mb-4 p-3 rounded-xl flex items-center gap-2"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: DS.red, fontSize: 13 }}>
          <AlertCircle size={14} /> {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Checklist */}
          <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem" }}>
            <div className="flex items-center gap-2 mb-4">
              <Shield size={14} style={{ color: DS.blue }} />
              <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 15, fontWeight: 800 }}>Checklist Bàn Giao</h2>
              {items.length > 0 && (
                <span className="ml-auto text-xs font-mono" style={{ color: completionPct === 100 ? DS.green : DS.text4 }}>
                  {completionPct}%
                </span>
              )}
            </div>
            <ChecklistEditor
              items={items}
              onChange={setItems}
              readOnly={!editMode}
            />
          </div>

          {/* Links */}
          <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem" }}>
            <div className="flex items-center gap-2 mb-4">
              <ExternalLink size={14} style={{ color: DS.purple }} />
              <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 15, fontWeight: 800 }}>Liên kết Dự án</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: "Figma Design", value: figmaUrl, onChange: setFigmaUrl, icon: <Globe size={12} />, color: DS.purple, placeholder: "https://figma.com/file/..." },
                { label: "GitHub Repository", value: githubUrl, onChange: setGithubUrl, icon: <GitBranch size={12} />, color: DS.cyan, placeholder: "https://github.com/..." },
                { label: "Deployment URL", value: deploymentUrl, onChange: setDeploymentUrl, icon: <ExternalLink size={12} />, color: DS.green, placeholder: "https://..." },
              ].map(({ label, value, onChange, icon, color, placeholder }) => (
                <div key={label}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div style={{ color, width: 14, height: 14 }}>{icon}</div>
                    <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>{label.toUpperCase()}</span>
                  </div>
                  {editMode ? (
                    <input
                      value={value}
                      onChange={e => onChange(e.target.value)}
                      placeholder={placeholder}
                      style={{ ...inpStyle, borderColor: `${color}30` }}
                    />
                  ) : value ? (
                    <a href={value} target="_blank" rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, background: `${color}08`, border: `1px solid ${color}25`, color, fontSize: 12, fontFamily: DS.mono, textDecoration: "none" }}>
                      {value.length > 50 ? value.slice(0, 50) + "..." : value}
                      <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span style={{ color: DS.text5, fontSize: 12, fontStyle: "italic" }}>Chưa có liên kết</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Scope */}
          <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem" }}>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={14} style={{ color: DS.amber }} />
              <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 15, fontWeight: 800 }}>Phạm vi & Tính năng</h2>
            </div>
            <ScopeEditor scope={scope} onChange={setScope} readOnly={!editMode} />
          </div>

          {/* Notes */}
          <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem" }}>
            <div className="flex items-center gap-2 mb-4">
              <Edit2 size={14} style={{ color: DS.text4 }} />
              <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 15, fontWeight: 800 }}>Ghi chú</h2>
            </div>
            <div className="space-y-4">
              {[
                { label: "Ghi chú kỹ thuật", value: notes, onChange: setNotes, placeholder: "Cấu hình, dependencies, lưu ý triển khai..." },
                { label: "Ghi chú Admin", value: adminNotes, onChange: setAdminNotes, placeholder: "Ghi chú nội bộ cho đội ngũ..." },
                { label: "Ghi chú cho Khách hàng", value: customerNotes, onChange: setCustomerNotes, placeholder: "Hướng dẫn sử dụng, lưu ý cho khách..." },
              ].map(({ label, value, onChange, placeholder }) => (
                <div key={label}>
                  <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginBottom: 6 }}>{label.toUpperCase()}</div>
                  {editMode ? (
                    <textarea
                      value={value}
                      onChange={e => onChange(e.target.value)}
                      placeholder={placeholder}
                      rows={3}
                      style={{ ...inpStyle, resize: "vertical", lineHeight: 1.6 }}
                    />
                  ) : value ? (
                    <p style={{ color: DS.text3, fontSize: 13, lineHeight: 1.7 }}>{value}</p>
                  ) : (
                    <span style={{ color: DS.text5, fontSize: 12, fontStyle: "italic" }}>Không có ghi chú</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Project info */}
          <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem" }}>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginBottom: 10 }}>THÔNG TIN ĐƠN HÀNG</div>
            <div className="space-y-2.5">
              {[
                { label: "Mã đơn", value: handover?.project?.orderNumber ?? "—" },
                { label: "Khách hàng", value: handover?.project?.customerName ?? "—" },
                { label: "Email", value: handover?.project?.customerEmail ?? "—" },
                { label: "Trạng thái đơn", value: handover?.project?.status ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span style={{ color: DS.text4, fontSize: 12 }}>{label}</span>
                  <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono, textAlign: "right", maxWidth: "55%" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Checklist summary */}
          <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem" }}>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginBottom: 10 }}>CHECKLIST</div>
            <div style={{ fontFamily: DS.heading, fontSize: 32, fontWeight: 900, color: completionPct === 100 ? DS.green : DS.text, marginBottom: 4 }}>
              {checkedItems}/{items.length}
            </div>
            <div style={{ color: DS.text4, fontSize: 11, marginBottom: 12 }}>
              {completionPct === 100 ? "✓ Hoàn tất bàn giao" : `${completionPct}% hoàn thành`}
            </div>
            <div className="space-y-1">
              {["draft", "pending_review", "approved", "handed_over"].map(s => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: s === status ? cfg.color : (STATUS_CONFIG.draft.color) }} />
                    <span style={{ color: s === status ? cfg.color : DS.text5, fontSize: 11, fontFamily: DS.mono }}>
                      {cfg.label}
                    </span>
                    {s === status && <CheckCircle2 size={10} style={{ color: cfg.color, marginLeft: "auto" }} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timestamps */}
          <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: "1.25rem" }}>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginBottom: 10 }}>TIMESTAMPS</div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span style={{ color: DS.text4, fontSize: 11 }}>Tạo</span>
                <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono }}>
                  {handover?.createdAt ? new Date(handover.createdAt).toLocaleDateString("vi-VN") : "—"}
                </span>
              </div>
              {handover?.handoverDate && (
                <div className="flex justify-between">
                  <span style={{ color: DS.text4, fontSize: 11 }}>Bàn giao</span>
                  <span style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono }}>
                    {new Date(handover.handoverDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
