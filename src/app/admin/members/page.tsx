"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { qk } from "@/lib/query/provider";
import { adminApi } from "@/lib/api/client";
import { useAuthStore, canEdit } from "@/app/store/authStore";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Plus, Edit2, Search, RefreshCw, Crown, Zap,
  Trash2, X, AlertCircle, CheckCircle2, Loader2,
  ChevronLeft, ChevronRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Member = {
  id: string;
  slug: string;
  name: string;
  role: string;
  image?: string | null;
  isActive: boolean;
  isFeatured: boolean;
  rank?: string;
  level?: number;
  roleLevel?: number;
  availableLp?: number;
  bio?: string | null;
  email?: string | null;
  phone?: string | null;
  sortOrder?: number;
};

type MemberForm = Partial<Member>;

const RANK_COLORS: Record<string, { color: string; bg: string }> = {
  Diamond: { color: "#60A5FA", bg: "rgba(96,165,250,0.12)" },
  Gold:    { color: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
  Silver:  { color: "#9CA3AF", bg: "rgba(156,163,175,0.1)" },
  Bronze:  { color: "#CD7F32", bg: "rgba(205,127,50,0.1)" },
  Iron:    { color: "#9CA3AF", bg: "transparent" },
};

const ROLE_OPTIONS = [
  { value: "ceo",           label: "CEO" },
  { value: "super_admin",   label: "Super Admin" },
  { value: "admin",         label: "Admin" },
  { value: "project_manager",label: "Project Manager" },
  { value: "media",         label: "Media" },
  { value: "qa",           label: "QA" },
  { value: "member",        label: "Member" },
];

// ── Shared form fields ────────────────────────────────────────────────────────

function Field({
  label, value, onChange, type = "text", placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: "0.875rem" }}>
      <label style={{
        display: "block", color: DS.text4, fontSize: "0.6875rem",
        fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em",
        marginBottom: "0.375rem",
      }}>
        {label.toUpperCase()}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", boxSizing: "border-box",
          background: DS.bgCard2, border: `1px solid ${DS.border}`,
          borderRadius: "0.625rem", padding: "0.625rem 0.875rem",
          color: DS.text, fontSize: "0.875rem", outline: "none",
          fontFamily: "'Inter', sans-serif",
        }}
      />
    </div>
  );
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div style={{ marginBottom: "0.875rem" }}>
      <label style={{
        display: "block", color: DS.text4, fontSize: "0.6875rem",
        fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em",
        marginBottom: "0.375rem",
      }}>
        {label.toUpperCase()}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", boxSizing: "border-box",
          background: DS.bgCard2, border: `1px solid ${DS.border}`,
          borderRadius: "0.625rem", padding: "0.625rem 0.875rem",
          color: DS.text, fontSize: "0.875rem", outline: "none",
          fontFamily: "'Inter', sans-serif",
          cursor: "pointer",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Member form modal ────────────────────────────────────────────────────────

function MemberModal({
  member, onClose, onSave,
}: {
  member?: Member | null;
  onClose: () => void;
  onSave: (data: MemberForm) => void;
}) {
  const isEdit = !!member;
  const [form, setForm] = useState<MemberForm>(member ?? {
    name: "", slug: "", role: "member", roleLevel: 5,
    bio: "", email: "", phone: "", isActive: true, isFeatured: false, sortOrder: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof MemberForm, value: string | boolean | number) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.slug?.trim()) {
      setError("Tên và slug là bắt buộc");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      setSaving(false);
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (v: string) => {
    setForm((f) => ({
      ...f,
      name: v,
      slug: f.slug || v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        style={{
          width: "100%", maxWidth: 480,
          background: DS.bgCard, border: `1px solid ${DS.border}`,
          borderRadius: "1.25rem", overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: `1px solid ${DS.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: "1rem", fontWeight: 900, color: DS.text, margin: 0 }}>
            {isEdit ? "Sửa thành viên" : "Thêm thành viên"}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: DS.text4, display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: "1.5rem", maxHeight: "70vh", overflowY: "auto" }}>
          {error && (
            <div style={{
              padding: "0.625rem 0.875rem", borderRadius: "0.5rem",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
              color: "#FCA5A5", fontSize: "0.8125rem", marginBottom: "1rem",
              display: "flex", alignItems: "center", gap: "0.5rem",
            }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Tên" value={form.name ?? ""} onChange={handleNameChange} placeholder="Nguyễn Văn A" />
            </div>
            <Field label="Slug" value={form.slug ?? ""} onChange={(v) => set("slug", v)} placeholder="nguyen-van-a" />
            <SelectField label="Vai trò" value={form.role ?? "member"} onChange={(v) => set("role", v)} options={ROLE_OPTIONS} />
            <Field label="Email" value={form.email ?? ""} onChange={(v) => set("email", v)} type="email" placeholder="nguyen@loop.vn" />
            <Field label="Điện thoại" value={form.phone ?? ""} onChange={(v) => set("phone", v)} placeholder="0912 345 678" />
            <Field label="Sort Order" value={String(form.sortOrder ?? 0)} onChange={(v) => set("sortOrder", parseInt(v) || 0)} placeholder="0" />
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Bio" value={form.bio ?? ""} onChange={(v) => set("bio", v)} placeholder="Mô tả ngắn về thành viên..." />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", color: DS.text3, fontSize: "0.875rem" }}>
                <input type="checkbox" checked={form.isActive ?? true} onChange={(e) => set("isActive", e.target.checked)} />
                Active
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", color: DS.text3, fontSize: "0.875rem" }}>
                <input type="checkbox" checked={form.isFeatured ?? false} onChange={(e) => set("isFeatured", e.target.checked)} />
                Featured (Hall of Fame)
              </label>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.625rem 1.25rem", borderRadius: "0.625rem",
                border: `1px solid ${DS.border}`, background: "transparent",
                color: DS.text3, cursor: "pointer", fontSize: "0.875rem",
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "0.625rem 1.5rem", borderRadius: "0.625rem",
                background: saving ? "rgba(59,130,246,0.6)" : GRD.primary,
                border: "none", color: "#fff", cursor: saving ? "not-allowed" : "pointer",
                fontSize: "0.875rem", fontWeight: 700,
                display: "flex", alignItems: "center", gap: "0.5rem",
                boxShadow: saving ? "none" : "0 0 20px rgba(129,140,248,0.35)",
              }}
            >
              {saving && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
              {saving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo thành viên"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteModal({
  member, onClose, onConfirm,
}: {
  member: Member; onClose: () => void; onConfirm: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
      setDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 101,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        style={{
          width: "100%", maxWidth: 400,
          background: DS.bgCard, border: `1px solid rgba(239,68,68,0.3)`,
          borderRadius: "1.25rem", overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ padding: "1.5rem", textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", margin: "0 auto 1rem",
            background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Trash2 size={22} style={{ color: DS.red }} />
          </div>
          <h3 style={{ color: DS.text, fontFamily: "'Cinzel', serif", fontSize: "1rem", marginBottom: "0.5rem" }}>
            Xóa thành viên?
          </h3>
          <p style={{ color: DS.text3, fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            Bạn có chắc muốn xóa <strong style={{ color: DS.text }}>{member.name}</strong>? Hành động này không thể hoàn tác.
          </p>
          {error && (
            <div style={{ color: DS.red, fontSize: "0.8125rem", marginBottom: "0.75rem", textAlign: "left" }}>
              <AlertCircle size={12} style={{ display: "inline", marginRight: 4 }} />
              {error}
            </div>
          )}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button
              onClick={onClose}
              style={{
                padding: "0.625rem 1.25rem", borderRadius: "0.625rem",
                border: `1px solid ${DS.border}`, background: "transparent",
                color: DS.text3, cursor: "pointer", fontSize: "0.875rem",
              }}
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={deleting}
              style={{
                padding: "0.625rem 1.25rem", borderRadius: "0.625rem",
                background: deleting ? "rgba(239,68,68,0.6)" : DS.red,
                border: "none", color: "#fff", cursor: deleting ? "not-allowed" : "pointer",
                fontSize: "0.875rem", fontWeight: 700,
                display: "flex", alignItems: "center", gap: "0.5rem",
              }}
            >
              {deleting && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
              {deleting ? "Đang xóa..." : "Xóa thành viên"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Member row ────────────────────────────────────────────────────────────────

function MemberRow({
  member, onEdit, onDelete, canModify,
}: {
  member: Member;
  onEdit: (m: Member) => void;
  onDelete: (m: Member) => void;
  canModify: boolean;
}) {
  const qc = useQueryClient();
  const rCfg = RANK_COLORS[member.rank ?? ""] ?? { color: DS.text4, bg: "transparent" };

  const toggleActive = useMutation({
    mutationFn: async () => {
      await adminApi.put(`/api/admin/team/${member.id}`, { isActive: !member.isActive });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.adminMembers() }),
    onError: (err) => { alert(err instanceof Error ? err.message : "Cập nhật thất bại"); },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12,
        padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 44, height: 44, borderRadius: "50%", overflow: "hidden",
        background: "#111827", flexShrink: 0,
        border: `2px solid ${rCfg.color}30`,
      }}>
        {member.image ? (
          <img src={member.image} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{
            width: "100%", height: "100%", display: "grid", placeItems: "center",
            color: DS.text5, fontSize: "1rem", fontWeight: 700,
          }}>
            {member.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <p style={{
            color: DS.text, fontWeight: 600, fontSize: 14, overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {member.name}
          </p>
          {member.isFeatured && <Crown size={11} style={{ color: DS.amber, flexShrink: 0 }} />}
        </div>
        <p style={{ color: DS.blue, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
          {member.role}
        </p>
      </div>

      {/* Rank + LP */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {member.rank && (
          <span style={{
            background: rCfg.bg, border: `1px solid ${rCfg.color}40`, color: rCfg.color,
            padding: "3px 10px", borderRadius: 9999, fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
            display: "flex", alignItems: "center", gap: 3,
          }}>
            {member.rank === "Diamond" ? <Crown size={10} /> : <Zap size={10} />}
            {member.rank}
          </span>
        )}
        {member.level && (
          <span style={{
            background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)",
            color: "#FBBF24", padding: "3px 10px", borderRadius: 9999, fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
          }}>
            LV{member.level}
          </span>
        )}
      </div>

      {/* Active toggle */}
      {canModify && (
        <button
          onClick={() => toggleActive.mutate()}
          disabled={toggleActive.isPending}
          style={{
            padding: "4px 10px", borderRadius: 9999,
            border: `1px solid ${member.isActive ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
            background: member.isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
            color: member.isActive ? "#22c55e" : DS.red,
            fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
            cursor: toggleActive.isPending ? "not-allowed" : "pointer",
            fontWeight: 600, flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
            opacity: toggleActive.isPending ? 0.6 : 1,
          }}
        >
          {toggleActive.isPending ? (
            <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <CheckCircle2 size={10} />
          )}
          {member.isActive ? "Active" : "Inactive"}
        </button>
      )}

      {/* Actions */}
      {canModify && (
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          <button
            onClick={() => onEdit(member)}
            title="Sửa"
            style={{
              background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)",
              borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.blue,
              display: "flex", alignItems: "center",
            }}
          >
            <Edit2 size={13} />
          </button>
          <button
            onClick={() => onDelete(member)}
            title="Xóa"
            style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.red,
              display: "flex", alignItems: "center",
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function MembersTabPage() {
  const qc = useQueryClient();
  const { role } = useAuthStore();
  const canModify = canEdit(role);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: qk.adminMembers({ page, limit: 20, search }),
    queryFn: async () => {
      const res = await adminApi.get<{
        data: Member[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(
        "/api/admin/team",
        { params: { page, limit: 20, ...(search ? { search } : {}) } }
      );
      return res;
    },
  });

  const members = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const handleSaveEdit = useCallback(async (form: MemberForm) => {
    if (!editTarget) return;
    try {
      await adminApi.put(`/api/admin/team/${editTarget.id}`, form);
      await qc.invalidateQueries({ queryKey: qk.adminMembers() });
      setEditTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Lưu thất bại");
    }
  }, [editTarget, qc]);

  const handleSaveAdd = useCallback(async (form: MemberForm) => {
    try {
      await adminApi.post("/api/admin/team", form);
      await qc.invalidateQueries({ queryKey: qk.adminMembers() });
      setAddOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Thêm thất bại");
    }
  }, [qc]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.delete(`/api/admin/team/${deleteTarget.id}`);
      await qc.invalidateQueries({ queryKey: qk.adminMembers() });
      setDeleteTarget(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xóa thất bại");
    }
  }, [deleteTarget, qc]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 800, color: DS.text, marginBottom: 2 }}>
            Thành viên
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
            {pagination?.total ?? 0} thành viên
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: qk.adminMembers({ page }) })}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10,
              color: DS.text3, cursor: "pointer", fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <RefreshCw size={13} style={isFetching ? { animation: "spin 1s linear infinite" } : {}} />
            Làm mới
          </button>
          {canModify && (
            <button
              onClick={() => setAddOpen(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
                background: GRD.primary, color: "#fff", border: "none",
                borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
                boxShadow: "0 0 20px rgba(129,140,248,0.35)",
              }}
            >
              <Plus size={14} /> Thêm thành viên
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
        <input
          type="text"
          placeholder="Tìm theo tên, vai trò..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{
            width: "100%", boxSizing: "border-box",
            background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10,
            padding: "8px 12px 8px 36px", color: DS.text, fontSize: 13,
            outline: "none", fontFamily: "'Inter', sans-serif",
          }}
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div style={{
            width: 32, height: 32, border: `2px solid ${DS.border}`,
            borderTop: `2px solid ${DS.blue}`, borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
        </div>
      )}

      {/* List */}
      {!isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, fontSize: 14 }}>
              {search ? "Không tìm thấy thành viên nào" : "Chưa có thành viên nào"}
            </div>
          ) : (
            members.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
                canModify={canModify}
              />
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 20 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: `1px solid ${DS.border}`, background: DS.bgCard,
              color: page === 1 ? DS.text5 : DS.text3, cursor: page === 1 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ color: DS.text3, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: `1px solid ${DS.border}`, background: DS.bgCard,
              color: page === totalPages ? DS.text5 : DS.text3,
              cursor: page === totalPages ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {addOpen && (
          <MemberModal
            onClose={() => setAddOpen(false)}
            onSave={handleSaveAdd}
          />
        )}
        {editTarget && (
          <MemberModal
            member={editTarget}
            onClose={() => setEditTarget(null)}
            onSave={handleSaveEdit}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            member={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
