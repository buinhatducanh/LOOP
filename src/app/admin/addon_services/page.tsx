"use client";

/**
 * Addon Services Admin Page — LOOP Solutions
 * Route: /admin/addon_services
 * CRUD for AddonService: slug, name, nameVi, type (one_time|recurring),
 * price, billingPeriod, sortOrder, isActive.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Plus, Edit3, X,
  Trash2, Search, RefreshCw,
  ToggleRight, ToggleLeft,
} from "lucide-react";
import { InlineLoader } from "@/components/ui/LoadingScreen";

// ── Types ─────────────────────────────────────────────────────────────────────

type Addon = {
  id: string;
  slug: string;
  name: string;
  nameVi: string;
  type: string; // "one_time" | "recurring"
  price: number;
  billingPeriod: string | null;
  isActive: boolean;
  sortOrder: number;
};

type FormData = {
  nameVi: string;
  name: string;
  slug: string;
  type: string;
  price: number;
  billingPeriod: string | null;
  sortOrder: number;
  isActive: boolean;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(n) + "₫";

const defaultForm: FormData = {
  nameVi: "",
  name: "",
  slug: "",
  type: "one_time",
  price: 0,
  billingPeriod: null,
  sortOrder: 0,
  isActive: true,
};

const typeLabels: Record<string, string> = {
  one_time: "Một lần",
  recurring: "Định kỳ",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddonServicesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showActive, setShowActive] = useState<boolean | null>(null);
  const [modal, setModal] = useState<{ open: boolean; edit?: Addon }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<Addon | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Fetch list
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["addon-services"],
    queryFn: () =>
      adminApi
        .get<{ data: Addon[] }>("/api/admin/pricing/addons?limit=100")
        .then((r) => r.data ?? []),
  });

  const items = (data ?? []).filter((a) => {
    if (
      search &&
      !a.name.toLowerCase().includes(search.toLowerCase()) &&
      !a.nameVi.toLowerCase().includes(search.toLowerCase()) &&
      !a.slug.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    if (showActive === true && !a.isActive) return false;
    if (showActive === false && a.isActive) return false;
    return true;
  });

  // Create / Update
  const save = useMutation({
    mutationFn: (payload: FormData) =>
      modal.edit
        ? adminApi.put(`/api/admin/pricing/addons/${modal.edit.id}`, {
            id: modal.edit.id,
            ...payload,
          })
        : adminApi.post("/api/admin/pricing/addons", payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addon-services"] });
      closeModal();
    },
  });

  // Toggle active
  const toggle = useMutation({
    mutationFn: (item: Addon) =>
      adminApi.put(`/api/admin/pricing/addons/${item.id}`, {
        id: item.id,
        nameVi: item.nameVi,
        name: item.name,
        slug: item.slug,
        type: item.type,
        price: item.price,
        billingPeriod: item.billingPeriod,
        sortOrder: item.sortOrder,
        isActive: !item.isActive,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addon-services"] }),
  });

  // Delete
  const remove = useMutation({
    mutationFn: (id: string) =>
      adminApi.delete(`/api/admin/pricing/addons?id=${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["addon-services"] });
      setDeleteTarget(null);
    },
  });

  const openCreate = () => {
    setForm(defaultForm);
    setErrors({});
    setModal({ open: true });
  };

  const openEdit = (a: Addon) => {
    setForm({
      nameVi: a.nameVi ?? "",
      name: a.name ?? "",
      slug: a.slug,
      type: a.type,
      price: a.price,
      billingPeriod: a.billingPeriod ?? null,
      sortOrder: a.sortOrder,
      isActive: a.isActive,
    });
    setErrors({});
    setModal({ open: true, edit: a });
  };

  const closeModal = () => setModal({ open: false });

  const generateSlug = () => {
    const s = (form.nameVi || form.name || "")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setForm((f) => ({ ...f, slug: s }));
  };

  const handleNameViChange = (value: string) => {
    setForm((f) => ({ ...f, nameVi: value }));
    // auto-fill name (EN) if empty
    if (!form.name.trim()) {
      setForm((f) => ({ ...f, name: value }));
    }
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.nameVi.trim()) e.nameVi = "Không được trống";
    if (!form.slug.trim()) e.slug = "Không được trống";
    if (form.price < 0) e.price = "Giá không hợp lệ";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    save.mutate(form);
  };

  return (
    <div style={{ padding: "1.5rem", minHeight: "100vh", background: DS.bgCosmic }}>
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
            Quản lý Dịch vụ Bổ sung
          </h1>
          <p style={{ color: DS.text4, fontSize: 13, marginTop: 4 }}>
            CRUD dịch vụ thêm: Domain, SSL, Hosting upgrade...
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${DS.border}`,
              color: DS.text4,
            }}
          >
            <RefreshCw
              size={13}
              style={{ color: DS.text4 }}
              className={isLoading ? "animate-spin" : ""}
            />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm"
            style={{ background: GRD.primary, color: "#fff" }}
          >
            <Plus size={16} />
            Thêm dịch vụ
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative" style={{ flex: 1, minWidth: 200 }}>
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: DS.text4 }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên, slug..."
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
                border: `1px solid ${
                  showActive === s ? DS.pink : DS.border
                }`,
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
                "Tên",
                "Slug",
                "Loại",
                "Giá",
                "Giai đoạn",
                "Thứ tự",
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
                  colSpan={8}
                  style={{
                    padding: 32,
                    textAlign: "center",
                    color: DS.text4,
                  }}
                >
                  <InlineLoader size={32} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: 32,
                    textAlign: "center",
                    color: DS.text4,
                  }}
                >
                  Chưa có dữ liệu
                </td>
              </tr>
            ) : (
              items.map((a) => (
                <tr
                  key={a.id}
                  style={{ borderTop: `1px solid ${DS.border}` }}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        color: DS.text,
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      {a.nameVi || a.name}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        color: DS.text4,
                        fontFamily: DS.mono,
                        fontSize: 11,
                      }}
                    >
                      {a.slug}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        background:
                          a.type === "recurring"
                            ? `${DS.purple}20`
                            : `${DS.cyan}20`,
                        color:
                          a.type === "recurring" ? DS.purple : DS.cyan,
                      }}
                    >
                      {typeLabels[a.type] ?? a.type}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        color: a.price > 0 ? DS.text : DS.text4,
                        fontFamily: DS.mono,
                        fontSize: 13,
                      }}
                    >
                      {a.price > 0 ? fmtVND(a.price) : "Miễn phí"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ color: DS.text4, fontSize: 12 }}>
                      {a.billingPeriod ?? "—"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        color: DS.text4,
                        fontFamily: DS.mono,
                        fontSize: 12,
                      }}
                    >
                      {a.sortOrder}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <button
                      onClick={() => toggle.mutate(a)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      {a.isActive ? (
                        <ToggleRight size={22} style={{ color: DS.green }} />
                      ) : (
                        <ToggleLeft size={22} style={{ color: DS.text4 }} />
                      )}
                    </button>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(a)}
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
                        onClick={() => setDeleteTarget(a)}
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
              ))
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
            onClick={(e) =>
              e.target === e.currentTarget && closeModal()
            }
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: "100%",
                maxWidth: 520,
                background: DS.bgCard,
                borderRadius: 20,
                border: `1px solid ${DS.border}`,
                overflow: "hidden",
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
                    {modal.edit ? "Sửa dịch vụ" : "Thêm dịch vụ mới"}
                  </h2>
                  <p style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>
                    {modal.edit
                      ? `Chỉnh sửa: ${modal.edit.nameVi || modal.edit.name}`
                      : "Tạo dịch vụ bổ sung mới cho booking wizard"}
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
                {/* nameVi */}
                <div>
                  <label
                    style={{
                      color: DS.text3,
                      fontSize: 11,
                      fontFamily: DS.mono,
                      letterSpacing: "0.1em",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Tên VN <span style={{ color: DS.pink }}>*</span>
                  </label>
                  <input
                    value={form.nameVi}
                    onChange={(e) => handleNameViChange(e.target.value)}
                    placeholder="VD: Hosting 1 năm, SSL Certificate..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(15,23,42,0.6)",
                      border: `1px solid ${
                        errors.nameVi ? DS.red : DS.border
                      }`,
                      borderRadius: 10,
                      color: DS.text,
                      fontSize: 14,
                    }}
                  />
                  {errors.nameVi && (
                    <p style={{ color: DS.red, fontSize: 11, marginTop: 4 }}>
                      {errors.nameVi}
                    </p>
                  )}
                </div>

                {/* name (auto-filled) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      style={{
                        color: DS.text3,
                        fontSize: 11,
                        fontFamily: DS.mono,
                        letterSpacing: "0.1em",
                      }}
                    >
                      Tên EN
                    </label>
                    {form.nameVi && !form.name && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, name: f.nameVi }))
                        }
                        style={{
                          background: "none",
                          border: "none",
                          color: DS.pink,
                          fontSize: 11,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Copy VN
                      </button>
                    )}
                  </div>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="English name (auto from Vietnamese)"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(15,23,42,0.6)",
                      border: `1px solid ${DS.border}`,
                      borderRadius: 10,
                      color: DS.text,
                      fontSize: 14,
                    }}
                  />
                </div>

                {/* slug */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      style={{
                        color: DS.text3,
                        fontSize: 11,
                        fontFamily: DS.mono,
                        letterSpacing: "0.1em",
                      }}
                    >
                      Slug <span style={{ color: DS.pink }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateSlug}
                      style={{
                        background: "none",
                        border: "none",
                        color: DS.pink,
                        fontSize: 11,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Auto
                    </button>
                  </div>
                  <input
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, slug: e.target.value }))
                    }
                    placeholder="hosting-1-nam"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(15,23,42,0.6)",
                      border: `1px solid ${
                        errors.slug ? DS.red : DS.border
                      }`,
                      borderRadius: 10,
                      color: DS.text,
                      fontSize: 14,
                    }}
                  />
                  {errors.slug && (
                    <p style={{ color: DS.red, fontSize: 11, marginTop: 4 }}>
                      {errors.slug}
                    </p>
                  )}
                </div>

                {/* type (radio) */}
                <div>
                  <label
                    style={{
                      color: DS.text3,
                      fontSize: 11,
                      fontFamily: DS.mono,
                      letterSpacing: "0.1em",
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Loại
                  </label>
                  <div className="flex gap-3">
                    {(["one_time", "recurring"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, type: t }))}
                        className="px-4 py-2 rounded-lg text-xs font-medium"
                        style={{
                          background:
                            form.type === t
                              ? `${DS.pink}20`
                              : "rgba(255,255,255,0.04)",
                          color: form.type === t ? DS.pink : DS.text4,
                          border: `1px solid ${
                            form.type === t ? DS.pink : DS.border
                          }`,
                          cursor: "pointer",
                        }}
                      >
                        {typeLabels[t]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* price + sortOrder */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      style={{
                        color: DS.text3,
                        fontSize: 11,
                        fontFamily: DS.mono,
                        letterSpacing: "0.1em",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Giá (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          price: Number(e.target.value),
                        }))
                      }
                      placeholder="0"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "rgba(15,23,42,0.6)",
                        border: `1px solid ${
                          errors.price ? DS.red : DS.border
                        }`,
                        borderRadius: 10,
                        color: DS.text,
                        fontSize: 14,
                      }}
                    />
                    {errors.price && (
                      <p
                        style={{
                          color: DS.red,
                          fontSize: 11,
                          marginTop: 4,
                        }}
                      >
                        {errors.price}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      style={{
                        color: DS.text3,
                        fontSize: 11,
                        fontFamily: DS.mono,
                        letterSpacing: "0.1em",
                        display: "block",
                        marginBottom: 6,
                      }}
                    >
                      Thứ tự hiển thị
                    </label>
                    <input
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          sortOrder: Number(e.target.value),
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "rgba(15,23,42,0.6)",
                        border: `1px solid ${DS.border}`,
                        borderRadius: 10,
                        color: DS.text,
                        fontSize: 14,
                      }}
                    />
                  </div>
                </div>

                {/* billingPeriod */}
                <div>
                  <label
                    style={{
                      color: DS.text3,
                      fontSize: 11,
                      fontFamily: DS.mono,
                      letterSpacing: "0.1em",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Giai đoạn thanh toán (tùy chọn)
                  </label>
                  <input
                    value={form.billingPeriod ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        billingPeriod: e.target.value || null,
                      }))
                    }
                    placeholder="VD: 1 năm, hàng tháng, hàng quý..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "rgba(15,23,42,0.6)",
                      border: `1px solid ${DS.border}`,
                      borderRadius: 10,
                      color: DS.text,
                      fontSize: 14,
                    }}
                  />
                </div>

                {/* isActive */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, isActive: !f.isActive }))
                    }
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {form.isActive ? (
                      <ToggleRight size={22} style={{ color: DS.green }} />
                    ) : (
                      <ToggleLeft size={22} style={{ color: DS.text4 }} />
                    )}
                  </button>
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
              zIndex: 1001,
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
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: "100%",
                maxWidth: 400,
                background: DS.bgCard,
                borderRadius: 20,
                border: `1px solid ${DS.border}`,
                overflow: "hidden",
              }}
            >
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: `1px solid ${DS.border}` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: `${DS.red}20` }}
                  >
                    <Trash2 size={18} style={{ color: DS.red }} />
                  </div>
                  <div>
                    <h2
                      style={{
                        color: DS.text,
                        fontFamily: DS.heading,
                        fontSize: 16,
                        fontWeight: 900,
                      }}
                    >
                      Xóa dịch vụ
                    </h2>
                    <p style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>
                      Hành động này không thể hoàn tác
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteTarget(null)}
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

              <div className="px-6 py-5">
                <p style={{ color: DS.text3, fontSize: 14 }}>
                  Bạn có chắc muốn xóa dịch vụ{" "}
                  <strong style={{ color: DS.text }}>
                    {deleteTarget.nameVi || deleteTarget.name}
                  </strong>{" "}
                  (slug:{" "}
                  <span style={{ fontFamily: DS.mono, color: DS.text4 }}>
                    {deleteTarget.slug}
                  </span>
                  )?
                </p>
              </div>

              <div
                className="flex items-center justify-end gap-3 px-6 py-4"
                style={{ borderTop: `1px solid ${DS.border}` }}
              >
                <button
                  onClick={() => setDeleteTarget(null)}
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
                  onClick={() => remove.mutate(deleteTarget.id)}
                  disabled={remove.isPending}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: DS.red,
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: remove.isPending ? "not-allowed" : "pointer",
                    opacity: remove.isPending ? 0.6 : 1,
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
