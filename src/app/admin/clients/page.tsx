"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { Search, RefreshCw, Users, TrendingUp, Mail, Phone, Plus, Edit2, Trash2, X, AlertTriangle } from "lucide-react";

type Client = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder?: string;
  status: string;
};

type ClientFormData = {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
};

const CLIENT_STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: "Hoạt động", color: DS.green, bg: "rgba(34,197,94,0.1)" },
  lead:     { label: "Lead", color: DS.blue, bg: "rgba(59,130,246,0.1)" },
  inactive: { label: "Không hoạt động", color: DS.text4, bg: "rgba(148,163,184,0.1)" },
};

function ClientEditModal({
  client,
  onClose,
  onSuccess,
}: {
  client: Client | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!client?.id;
  const [form, setForm] = useState<ClientFormData>({
    name: client?.name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    company: client?.company ?? "",
    status: client?.status ?? "lead",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Tên là bắt buộc");
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return setError("Email không hợp lệ");
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        customerName: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        company: form.company.trim() || undefined,
        status: form.status,
      };
      if (isEdit) {
        await adminApi.put(`/api/admin/sales-leads/${client!.id}`, payload);
      } else {
        await adminApi.post("/api/admin/sales-leads", payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const inp = {
    width: "100%", background: DS.bg, border: `1px solid ${DS.border}`,
    borderRadius: 10, padding: "9px 12px", color: DS.text, fontSize: 13,
    outline: "none", boxSizing: "border-box" as const, fontFamily: DS.body,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 460 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18 }}>{isEdit ? "Sửa khách hàng" : "Thêm khách hàng"}</h3>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>TÊN *</label>
              <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nguyễn Văn A" required />
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>EMAIL *</label>
              <input style={inp} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="khach@company.vn" required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>ĐIỆN THOẠI</label>
                <input style={inp} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0901..." />
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>CÔNG TY</label>
                <input style={inp} value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Công ty ABC" />
              </div>
            </div>
            <div>
              <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.08em", display: "block", marginBottom: 4 }}>TRẠNG THÁI</label>
              <select style={{ ...inp, cursor: "pointer" }} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="lead">Lead</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>

            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "8px 12px", color: "#EF4444", fontSize: 12 }}>
                <AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />{error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 13 }}>
                Hủy
              </button>
              <button type="submit" disabled={saving} style={{ flex: 1, padding: "10px", background: saving ? DS.text4 : GRD.primary, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontSize: 13 }}>
                {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Thêm khách hàng"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function ClientsTabPage() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editClient, setEditClient] = useState<Client | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "clients", search],
    queryFn: async () => {
      const res = await adminApi.get<{ data: Client[] }>(
        "/api/admin/sales-leads",
        { params: search ? { search } : {} }
      );
      return res;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await adminApi.delete(`/api/admin/sales-leads/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "clients"] }),
    onError: (err: unknown) => { setToast({ message: err instanceof Error ? err.message : "Xóa thất bại", type: "error" }); },
  });

  const clients = data?.data ?? [];

  const filtered = clients.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.company ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

  const totalRevenue = clients.reduce((s, c) => s + (c.totalSpent ?? 0), 0);

  return (<>
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, marginBottom: 2 }}>Khách hàng & Sales</h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{clients.length} khách hàng</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["admin", "clients"] })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
          >
            <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Làm mới
          </button>
          <button
            onClick={() => setEditClient({} as Client)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: GRD.primary, border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}
          >
            <Plus size={13} /> Thêm khách hàng
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Tổng khách hàng", value: clients.length.toString(), icon: <Users size={16} />, color: DS.blue },
          { label: "Doanh thu tổng", value: fmt(totalRevenue).replace("₫", "").trim(), icon: <TrendingUp size={16} />, color: DS.green },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${kpi.color}15`, border: `1px solid ${kpi.color}30`, display: "flex", alignItems: "center", justifyContent: "center", color: kpi.color, flexShrink: 0 }}>
              {kpi.icon}
            </div>
            <div>
              <p style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 2 }}>{kpi.label.toUpperCase()}</p>
              <p style={{ color: DS.text, fontWeight: 800, fontSize: 18 }}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
        <input
          type="text"
          placeholder="Tìm theo tên, email, công ty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "8px 12px 8px 36px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: DS.body }}
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {/* List */}
      {!isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, fontSize: 14 }}>Không tìm thấy khách hàng</div>
          ) : (
            filtered.map((client) => {
              const sc = CLIENT_STATUS_CFG[client.status] ?? { label: client.status, color: DS.text4, bg: "transparent" };
              return (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}
                >
                  {/* Avatar */}
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: DS.blue, fontWeight: 800, fontSize: 16 }}>
                      {client.name.charAt(0)}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: DS.text, fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{client.name}</p>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{ color: DS.text4, fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                        <Mail size={10} /> {client.email}
                      </span>
                      {client.phone && (
                        <span style={{ color: DS.text4, fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}>
                          <Phone size={10} /> {client.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <span style={{ background: sc.bg, color: sc.color, padding: "2px 10px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 600, flexShrink: 0 }}>
                    {sc.label}
                  </span>

                  {/* Stats */}
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 12px", textAlign: "center" }}>
                      <p style={{ color: DS.blue, fontWeight: 700, fontSize: 14 }}>{client.totalOrders}</p>
                      <p style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono }}>đơn hàng</p>
                    </div>
                    <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 12px", textAlign: "right" }}>
                      <p style={{ color: DS.green, fontWeight: 700, fontSize: 14 }}>{fmt(client.totalSpent)}</p>
                      <p style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono }}>tổng chi</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    <button
                      onClick={() => setEditClient(client)}
                      style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: DS.blue, display: "flex", alignItems: "center" }}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => { if (confirm("Xoa khach hang nay?")) deleteMutation.mutate(client.id); }}
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "5px 8px", cursor: "pointer", color: "#EF4444", display: "flex", alignItems: "center" }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Create/Edit modal */}
      <ClientEditModal
        client={editClient}
        onClose={() => setEditClient(null)}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["admin", "clients"] })}
      />
    </div>
    {toast && (
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12, background: "#0F172A", border: `1px solid ${toast.type === "success" ? "#22C55E" : "#CC3344"}50`, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", maxWidth: 320 }}>
        <span style={{ color: toast.type === "success" ? "#22C55E" : "#CC3344", fontSize: 16 }}>{toast.type === "success" ? "✓" : "✗"}</span>
        <span style={{ color: "#fff", fontSize: 13 }}>{toast.message}</span>
        <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#94A3B8" }}><X size={14} /></button>
      </div>
    )}
    </>
  );
}
