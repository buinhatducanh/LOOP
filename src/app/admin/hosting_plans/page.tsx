"use client";

/**
 * Hosting Plans Admin Page — LOOP Solutions
 * Route: /admin/hosting_plans
 * CRUD for HostingPlan: name, slug, monthlyPrice, months, discountPct,
 * features, featuresVi, highlighted, color, sortOrder, isActive.
 * API: /api/admin/pricing/hosting-plans
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Plus, Search, X, Trash2, Edit3,
  ToggleRight, ToggleLeft, RefreshCw, Server,
} from "lucide-react";
import { InlineLoader } from "@/components/ui/LoadingScreen";

// ── Types ─────────────────────────────────────────────────────────────────────

type HostingPlan = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  monthlyPrice: number;
  months: number;
  discountPct: number;
  features: string[];
  featuresVi: string[];
  highlighted: boolean;
  color: string;
  sortOrder: number;
  isActive: boolean;
};

type FormData = {
  slug: string;
  name: string;
  nameVi: string;
  monthlyPrice: number;
  months: number;
  discountPct: number;
  features: string;
  periodLabel: string;
  featuresVi: string;
  highlighted: boolean;
  color: string;
  sortOrder: number;
  isActive: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────────

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(n) + "₫";

// Unified period options: 6 months, 1 year, 2 years, 3 years
const MONTHS_OPTIONS: Array<{ value: number; labelEn: string; labelVi: string }> = [
  { value: 12, labelEn: "1 year",  labelVi: "1 năm" },
  { value: 24, labelEn: "2 years", labelVi: "2 năm" },
  { value: 36, labelEn: "3 years", labelVi: "3 năm" },
];

const calcTotal = (monthly: number, mo: number, discount: number) => {
  if (discount > 0) return Math.round(monthly * mo * (1 - discount / 100));
  return monthly * mo;
};

const defaultForm: FormData = {
  slug: "",
  name: "",
  nameVi: "",
  monthlyPrice: 0,
  months: 12,
  discountPct: 0,
  periodLabel: "1 năm",
  features: "",
  featuresVi: "",
  highlighted: false,
  color: "#3B82F6",
  sortOrder: 0,
  isActive: true,
};

// ── Toggle Component ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  size = 20,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  size?: number;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 36,
        height: size,
        borderRadius: size / 2,
        border: "none",
        cursor: "pointer",
        background: checked ? DS.green : DS.border,
        transition: "background 0.2s",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 18 : 2,
          width: size - 4,
          height: size - 4,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

// ── Component ───────────────────────────────────────────────────────────────────

export default function HostingPlansPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showActive, setShowActive] = useState<boolean | null>(null);
  const [modal, setModal] = useState<{ open: boolean; edit?: HostingPlan }>({
    open: false,
  });
  const [form, setForm] = useState<FormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {},
  );
  const [deleteTarget, setDeleteTarget] = useState<HostingPlan | null>(null);

  // Fetch
  const { data, isLoading } = useQuery({
    queryKey: ["hosting-plans"],
    queryFn: () =>
      adminApi
        .get<{ data: HostingPlan[] }>("/api/admin/pricing/hosting-plans")
        .then((r) => r.data ?? []),
  });

  const items = (data ?? []).filter((d) => {
    if (
      search &&
      !(d.nameVi || d.name)
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      !d.slug.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (showActive === true && !d.isActive) return false;
    if (showActive === false && d.isActive) return false;
    return true;
  });

  // Create / Update
  const save = useMutation({
    mutationFn: (payload: FormData) => {
      const body = {
        slug: payload.slug,
        name: payload.name,
        nameVi: payload.nameVi,
        monthlyPrice: Number(payload.monthlyPrice) || 0,
        months: Number(payload.months) || 12,
        discountPct: Number(payload.discountPct) || 0,
        features: payload.features
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        featuresVi: payload.featuresVi
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        highlighted: payload.highlighted,
        color: payload.color,
        sortOrder: Number(payload.sortOrder) || 0,
        isActive: payload.isActive,
      };
      if (modal.edit) {
        return adminApi.put<{ data: HostingPlan }>(
          "/api/admin/pricing/hosting-plans",
          { ...body, id: modal.edit.id },
        );
      }
      return adminApi.post<{ data: HostingPlan }>(
        "/api/admin/pricing/hosting-plans",
        body,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hosting-plans"] });
      closeModal();
    },
  });

  // Toggle active
  const toggle = useMutation({
    mutationFn: (item: HostingPlan) =>
      adminApi.put("/api/admin/pricing/hosting-plans", {
        slug: item.slug,
        name: item.name,
        nameVi: item.nameVi,
        monthlyPrice: item.monthlyPrice,
        months: item.months,
        discountPct: item.discountPct,
        features: item.features,
        featuresVi: item.featuresVi,
        highlighted: item.highlighted,
        color: item.color,
        sortOrder: item.sortOrder,
        isActive: !item.isActive,
        id: item.id,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hosting-plans"] }),
  });

  // Delete
  const remove = useMutation({
    mutationFn: (id: string) =>
      adminApi.delete(`/api/admin/pricing/hosting-plans?id=${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hosting-plans"] });
      setDeleteTarget(null);
    },
  });

  const openCreate = () => {
    setForm(defaultForm);
    setErrors({});
    setModal({ open: true });
  };

  const openEdit = (d: HostingPlan) => {
    setForm({
      slug: d.slug,
      name: d.name,
      nameVi: d.nameVi,
      monthlyPrice: d.monthlyPrice,
      months: d.months,
      periodLabel: MONTHS_OPTIONS.find(o => o.value === d.months)?.labelVi ?? `${d.months} tháng`,
      discountPct: d.discountPct,
      features: (d.features || []).join(", "),
      featuresVi: (d.featuresVi || []).join(", "),
      highlighted: d.highlighted,
      color: d.color || "#3B82F6",
      sortOrder: d.sortOrder,
      isActive: d.isActive,
    });
    setErrors({});
    setModal({ open: true, edit: d });
  };

  const closeModal = () => setModal({ open: false });

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.slug.trim()) e.slug = "Không được trống";
    if (!form.nameVi.trim()) e.nameVi = "Không được trống";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    save.mutate(form);
  };

  const inpStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(15, 23, 42, 0.6)",
    border: `1px solid ${DS.border}`,
    borderRadius: 10,
    padding: "10px 14px",
    color: DS.text,
    fontSize: 13,
    outline: "none",
    fontFamily: DS.body,
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    color: DS.text3,
    fontSize: 11,
    fontFamily: DS.mono,
    letterSpacing: "0.08em",
    display: "block",
    marginBottom: 6,
  };

  return (
    <div
      style={{
        padding: "1.5rem",
        minHeight: "100vh",
        background: DS.bgCosmic,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            style={{
              color: DS.text,
              fontFamily: DS.heading,
              fontSize: 22,
              fontWeight: 900,
            }}
          >
            Quản lý Gói Hosting
          </h1>
          <p style={{ color: DS.text4, fontSize: 13, marginTop: 4 }}>
            CRUD gói hosting dùng trong web purchase wizard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              qc.invalidateQueries({ queryKey: ["hosting-plans"] })
            }
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${DS.border}`,
              color: DS.text3,
              cursor: "pointer",
              fontFamily: DS.mono,
              fontSize: 12,
            }}
          >
            <RefreshCw size={13} />
            Làm mới
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm"
            style={{ background: GRD.primary, color: "#fff" }}
          >
            <Plus size={16} />
            Thêm gói hosting
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: DS.text4 }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc slug..."
            style={{
              width: "100%",
              paddingLeft: 36,
              paddingRight: 16,
              paddingTop: 10,
              paddingBottom: 10,
              background: "rgba(15,23,42,0.6)",
              border: `1px solid ${DS.border}`,
              borderRadius: 10,
              color: DS.text,
              fontSize: 14,
            }}
          />
        </div>
        <div className="flex gap-1">
          {([null, true, false] as const).map((s) => (
            <button
              key={String(s)}
              onClick={() => setShowActive(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background:
                  showActive === s ? DS.pink : "rgba(255,255,255,0.04)",
                color: showActive === s ? "#fff" : DS.text4,
                border: `1px solid ${showActive === s ? DS.pink : DS.border}`,
              }}
            >
              {s === null ? "Tất cả" : s ? "Đang bật" : "Đã tắt"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${DS.border}`,
          background: DS.bgCard,
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              {[
                "Gói",
                "Giá/tháng",
                "Tháng",
                "Giảm giá",
                "Tổng",
                "Tính năng",
                "Thứ tự",
                "Nổi bật",
                "Trạng thái",
                "Hành động",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 16px",
                    color: DS.text4,
                    fontSize: 11,
                    fontFamily: DS.mono,
                    letterSpacing: "0.1em",
                    textAlign: "left",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={10}
                  style={{
                    padding: 32,
                    textAlign: "center",
                    color: DS.text4,
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <InlineLoader size={18} />
                    Đang tải...
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  style={{
                    padding: 32,
                    textAlign: "center",
                    color: DS.text4,
                  }}
                >
                  Chưa có gói hosting nào
                </td>
              </tr>
            ) : (
              items.map((d) => {
                const total = calcTotal(
                  d.monthlyPrice,
                  d.months,
                  d.discountPct,
                );
                return (
                  <tr
                    key={d.id}
                    style={{
                      borderTop: `1px solid ${DS.border}`,
                      opacity: d.isActive ? 1 : 0.5,
                    }}
                  >
                    <td style={{ padding: "14px 16px" }}>
                      <div className="flex items-center gap-2">
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: d.color || DS.blue,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Server size={14} style={{ color: "#fff" }} />
                        </div>
                        <div>
                          <div
                            style={{
                              color: DS.text,
                              fontWeight: 600,
                              fontSize: 13,
                            }}
                          >
                            {d.nameVi || d.name}
                          </div>
                          <div
                            style={{
                              color: DS.text4,
                              fontSize: 10,
                              fontFamily: DS.mono,
                            }}
                          >
                            {d.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          color: DS.text,
                          fontFamily: DS.mono,
                          fontSize: 13,
                        }}
                      >
                        {fmtVND(d.monthlyPrice)}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          color: DS.text3,
                          fontSize: 13,
                          fontFamily: DS.mono,
                        }}
                      >
                        {MONTHS_OPTIONS.find(o => o.value === d.months)?.labelVi ?? `${d.months} tháng`}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {d.discountPct > 0 ? (
                        <span
                          style={{
                            color: DS.green,
                            fontFamily: DS.mono,
                            fontSize: 12,
                            background: `${DS.green}22`,
                            padding: "2px 8px",
                            borderRadius: 6,
                          }}
                        >
                          -{d.discountPct}%
                        </span>
                      ) : (
                        <span style={{ color: DS.text4, fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          color: DS.blue,
                          fontFamily: DS.mono,
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {fmtVND(total)}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ maxWidth: 200 }}>
                        {(d.featuresVi || d.features || [])
                          .slice(0, 3)
                          .map((f, i) => (
                            <div
                              key={i}
                              style={{
                                color: DS.text4,
                                fontSize: 11,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: 200,
                              }}
                            >
                              • {f}
                            </div>
                          ))}
                        {(d.featuresVi || d.features || []).length > 3 && (
                          <div
                            style={{
                              color: DS.text4,
                              fontSize: 10,
                              fontFamily: DS.mono,
                            }}
                          >
                            +{(d.featuresVi || d.features || []).length - 3} more
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          color: DS.text4,
                          fontFamily: DS.mono,
                          fontSize: 12,
                        }}
                      >
                        {d.sortOrder}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {d.highlighted ? (
                        <span
                          style={{
                            background: d.color || DS.blue,
                            color: "#fff",
                            borderRadius: 6,
                            padding: "2px 8px",
                            fontSize: 10,
                            fontFamily: DS.mono,
                          }}
                        >
                          NỔI BẬT
                        </span>
                      ) : (
                        <span style={{ color: DS.text4, fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button
                        onClick={() => toggle.mutate(d)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        {d.isActive ? (
                          <ToggleRight size={22} style={{ color: DS.green }} />
                        ) : (
                          <ToggleLeft size={22} style={{ color: DS.text4 }} />
                        )}
                      </button>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(d)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 4,
                            borderRadius: 6,
                          }}
                          className="hover:bg-white/10 transition-colors"
                        >
                          <Edit3 size={15} style={{ color: DS.pink }} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(d)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 4,
                            borderRadius: 6,
                          }}
                          className="hover:bg-white/10 transition-colors"
                        >
                          <Trash2 size={15} style={{ color: DS.red }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(8px)",
            }}
            onClick={(e) => e.target === e.currentTarget && closeModal()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: "100%",
                maxWidth: 580,
                maxHeight: "90vh",
                overflowY: "auto",
                background: DS.bgCard,
                borderRadius: 20,
                border: `1px solid ${DS.border}`,
              }}
            >
              {/* Modal header */}
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: `1px solid ${DS.border}` }}
              >
                <div>
                  <h2
                    style={{
                      color: DS.text,
                      fontFamily: DS.heading,
                      fontSize: 16,
                      fontWeight: 900,
                    }}
                  >
                    {modal.edit
                      ? "Sửa gói hosting"
                      : "Thêm gói hosting mới"}
                  </h2>
                  <p style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>
                    {modal.edit
                      ? `Chỉnh sửa ${modal.edit.nameVi || modal.edit.name}`
                      : "Tạo gói hosting mới cho web purchase wizard"}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  <X size={18} style={{ color: DS.text4 }} />
                </button>
              </div>

              {/* Form */}
              <div className="px-6 py-5 space-y-4">
                {/* Name + Slug */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>
                      Tên gói (VN) <span style={{ color: DS.pink }}>*</span>
                    </label>
                    <input
                      style={{
                        ...inpStyle,
                        borderColor: errors.nameVi ? DS.red : DS.border,
                      }}
                      value={form.nameVi}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          nameVi: e.target.value,
                          name: e.target.value,
                        }))
                      }
                      placeholder="VD: Gói Starter 2GB"
                    />
                    {errors.nameVi && (
                      <p style={{ color: DS.red, fontSize: 11, marginTop: 4 }}>
                        {errors.nameVi}
                      </p>
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>
                      Slug <span style={{ color: DS.pink }}>*</span>
                    </label>
                    <input
                      style={{
                        ...inpStyle,
                        borderColor: errors.slug ? DS.red : DS.border,
                      }}
                      value={form.slug}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, slug: e.target.value }))
                      }
                      placeholder="VD: starter-2gb"
                    />
                    {errors.slug && (
                      <p style={{ color: DS.red, fontSize: 11, marginTop: 4 }}>
                        {errors.slug}
                      </p>
                    )}
                  </div>
                </div>

                {/* Price / Months / Discount */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label style={labelStyle}>Giá/tháng (VND)</label>
                    <input
                      type="number"
                      style={inpStyle}
                      value={form.monthlyPrice}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          monthlyPrice: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Thời hạn</label>
                    <select
                      style={{ ...inpStyle, padding: "10px 14px" }}
                      value={form.months}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const opt = MONTHS_OPTIONS.find(o => o.value === val);
                        setForm(f => ({ ...f, months: val, periodLabel: opt?.labelVi ?? `${val} tháng` }));
                      }}
                    >
                      {MONTHS_OPTIONS.map(o => (
                        <option key={o.value} value={o.value} style={{ background: DS.bgCard }}>
                          {o.labelVi}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Giảm giá (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      style={inpStyle}
                      value={form.discountPct}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          discountPct: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Price Calculator Preview */}
                <div
                  style={{
                    background: "rgba(15,23,42,0.6)",
                    border: `1px solid ${DS.pink}33`,
                    borderRadius: 12,
                    padding: "14px 16px",
                  }}
                >
                  <div
                    style={{
                      color: DS.text4,
                      fontSize: 11,
                      fontFamily: DS.mono,
                      letterSpacing: "0.08em",
                      marginBottom: 10,
                    }}
                  >
                    PRICE CALCULATOR PREVIEW
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {MONTHS_OPTIONS.map((o) => {
                      const mo = o.value;
                      const t = calcTotal(
                        Number(form.monthlyPrice) || 0,
                        mo,
                        Number(form.discountPct) || 0,
                      );
                      const base = (Number(form.monthlyPrice) || 0) * mo;
                      return (
                        <div
                          key={mo}
                          style={{
                            background: DS.bg,
                            border: `1px solid ${DS.border}`,
                            borderRadius: 10,
                            padding: "8px 14px",
                            minWidth: 110,
                          }}
                        >
                          <div
                            style={{
                              color: DS.text4,
                              fontSize: 10,
                              fontFamily: DS.mono,
                            }}
                          >
                            {mo} tháng
                          </div>
                          <div
                            style={{
                              color: DS.pink,
                              fontFamily: DS.mono,
                              fontWeight: 700,
                              fontSize: 15,
                            }}
                          >
                            {fmtVND(t)}
                          </div>
                          {Number(form.discountPct) > 0 && (
                            <div
                              style={{
                                color: DS.green,
                                fontSize: 10,
                                fontFamily: DS.mono,
                                textDecoration: "line-through",
                              }}
                            >
                              {fmtVND(base)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Features EN */}
                <div>
                  <label style={labelStyle}>
                    Tính năng (EN, cách nhau dấu phẩy)
                  </label>
                  <input
                    style={inpStyle}
                    value={form.features}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, features: e.target.value }))
                    }
                    placeholder="2GB SSD, Unlimited Bandwidth, Free SSL, Daily Backup"
                  />
                </div>

                {/* Features VI */}
                <div>
                  <label style={labelStyle}>
                    Tính năng (VN, cách nhau dấu phẩy)
                  </label>
                  <input
                    style={inpStyle}
                    value={form.featuresVi}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, featuresVi: e.target.value }))
                    }
                    placeholder="2GB SSD, Băng thông không giới hạn, SSL miễn phí, Backup hàng ngày"
                  />
                </div>

                {/* Sort Order / Color / Highlighted */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label style={labelStyle}>Thứ tự hiển thị</label>
                    <input
                      type="number"
                      style={inpStyle}
                      value={form.sortOrder}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          sortOrder: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Màu sắc</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        style={{
                          width: 40,
                          height: 40,
                          padding: 2,
                          borderRadius: 8,
                          border: `1px solid ${DS.border}`,
                          background: "transparent",
                          cursor: "pointer",
                        }}
                        value={form.color}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, color: e.target.value }))
                        }
                      />
                      <input
                        style={inpStyle}
                        value={form.color}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, color: e.target.value }))
                        }
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Nổi bật</label>
                    <div className="flex items-center gap-3 pt-2">
                      <Toggle
                        checked={form.highlighted}
                        onChange={(v) =>
                          setForm((f) => ({ ...f, highlighted: v }))
                        }
                      />
                      <span style={{ color: DS.text3, fontSize: 12 }}>
                        {form.highlighted ? "Bật" : "Tắt"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <Toggle
                    checked={form.isActive}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, isActive: v }))
                    }
                  />
                  <span style={{ color: DS.text3, fontSize: 13 }}>
                    {form.isActive ? "Đang bật" : "Đã tắt"}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-end gap-3 px-6 py-4"
                style={{ borderTop: `1px solid ${DS.border}` }}
              >
                <button
                  onClick={closeModal}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: `1px solid ${DS.border}`,
                    background: "rgba(255,255,255,0.04)",
                    color: DS.text3,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleSave}
                  disabled={save.isPending}
                  style={{
                    padding: "10px 24px",
                    borderRadius: 10,
                    border: "none",
                    background: GRD.primary,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: save.isPending ? "not-allowed" : "pointer",
                    opacity: save.isPending ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {save.isPending ? (
                    <InlineLoader size={14} color="#fff" />
                  ) : modal.edit ? (
                    "Lưu thay đổi"
                  ) : (
                    "Tạo mới"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1100,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(8px)",
            }}
            onClick={(e) =>
              e.target === e.currentTarget && setDeleteTarget(null)
            }
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                width: "100%",
                maxWidth: 400,
                background: DS.bgCard,
                borderRadius: 16,
                border: `1px solid ${DS.red}44`,
                padding: 24,
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: `${DS.red}22`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                  }}
                >
                  <Trash2 size={22} style={{ color: DS.red }} />
                </div>
                <h3
                  style={{
                    color: DS.text,
                    fontWeight: 700,
                    fontSize: 16,
                    margin: "0 0 8px",
                  }}
                >
                  Xóa gói hosting?
                </h3>
                <p style={{ color: DS.text4, fontSize: 13, margin: 0 }}>
                  Bạn có chắc muốn xóa gói "
                  <strong style={{ color: DS.text }}>
                    {deleteTarget.nameVi || deleteTarget.name}
                  </strong>
                  "? Hành động này không thể hoàn tác.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm"
                  style={{
                    border: `1px solid ${DS.border}`,
                    background: "rgba(255,255,255,0.04)",
                    color: DS.text3,
                    cursor: "pointer",
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={() => remove.mutate(deleteTarget.id)}
                  disabled={remove.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold"
                  style={{
                    border: "none",
                    background: DS.red,
                    color: "#fff",
                    cursor: remove.isPending ? "not-allowed" : "pointer",
                    opacity: remove.isPending ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  {remove.isPending ? (
                    <InlineLoader size={14} color="#fff" />
                  ) : (
                    "Xóa"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
