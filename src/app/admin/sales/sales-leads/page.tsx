"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Search, Phone, Mail, Building2 } from "lucide-react";

interface SalesLead {
  id: string;
  source: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  companyName: string | null;
  area: string;
  tier: string;
  status: string;
  note: string | null;
  estimatedBudget: number | null;
  assignedTo: string | null;
  createdAt: string;
  _count?: { quotes: number; orders: number };
}

interface CreateForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  source: string;
  area: string;
  tier: string;
  note: string;
  estimatedBudget: string;
}

const STAGES = ["new", "contacted", "qualified", "proposal", "won", "lost"] as const;
type Stage = typeof STAGES[number];

const STAGE_LABELS: Record<Stage, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  qualified: "Qualified",
  proposal: "Báo giá",
  won: "Thắng",
  lost: "Thua",
};

const STAGE_COLORS: Record<Stage, string> = {
  new: "#6366F1",
  contacted: "#3B82F6",
  qualified: "#8B5CF6",
  proposal: "#F59E0B",
  won: "#10B981",
  lost: "#EF4444",
};

const SOURCE_COLORS: Record<string, string> = {
  facebook: "#1877F2",
  zalo: "#0068FF",
  website: "#6366F1",
  referral: "#10B981",
  cold_call: "#F59E0B",
};

const TIER_LABELS: Record<string, string> = {
  key_account: "Key Account",
  sme: "SME",
  fb: "F&B",
  retail: "Retail",
};

const AREA_LABELS: Record<string, string> = {
  can_tho: "Cần Thơ",
  an_giang: "An Giang",
  kien_giang: "Kiên Giang",
  dong_thap: "Đồng Tháp",
  long_an: "Long An",
  tien_giang: "Tiền Giang",
  vinh_long: "Vĩnh Long",
  ben_tre: "Bến Tre",
  tra_vinh: "Trà Vinh",
};

const fmtPrice = (n: number) =>
  n ? Intl.NumberFormat("vi-VN").format(n) + " ₫" : "—";

const emptyForm: CreateForm = {
  customerName: "", customerEmail: "", customerPhone: "",
  companyName: "", source: "website", area: "can_tho",
  tier: "sme", note: "", estimatedBudget: "",
};

export default function SalesLeadsPage() {
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<Partial<CreateForm>>({});

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/sales-leads?${params}`);
      const json = await res.json();
      setLeads(json.data ?? []);
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const createLead = async () => {
    if (!form.customerName.trim()) {
      toast.error("Tên khách hàng bắt buộc");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/sales-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          estimatedBudget: form.estimatedBudget ? parseInt(form.estimatedBudget) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Đã tạo lead");
      setShowCreate(false);
      setForm(emptyForm);
      fetchLeads();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    } finally { setSaving(false); }
  };

  const updateLeadStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/sales-leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      toast.success(`Đã chuyển sang "${STAGE_LABELS[status as Stage] || status}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    }
  };

  const leadsByStage = (stage: Stage) =>
    leads.filter(l => l.status === stage);

  const totalBudget = (stage: Stage) =>
    leadsByStage(stage).reduce((s, l) => s + (l.estimatedBudget ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Sales Leads</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            {leads.length} leads · Pipeline CRM
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="rounded-lg border pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 outline-none"
              style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
            />
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg px-4 py-2 text-sm font-bold text-white"
            style={{ background: "#6366F1" }}
          >
            + Lead mới
          </button>
        </div>
      </div>

      {/* Kanban Pipeline */}
      {loading ? (
        <div className="grid grid-cols-6 gap-3">
          {STAGES.map(s => (
            <div key={s} className="rounded-xl border p-3 animate-pulse"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="h-4 rounded mb-3" style={{ background: "rgba(255,255,255,0.08)" }} />
              {[1,2,3].map(i => (
                <div key={i} className="h-16 rounded-lg mb-2" style={{ background: "rgba(255,255,255,0.04)" }} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map(stage => {
            const stageLeads = leadsByStage(stage);
            const budget = totalBudget(stage);
            return (
              <div key={stage}>
                {/* Column header */}
                <div className="rounded-t-xl border-b-0 border p-3"
                  style={{
                    background: `${STAGE_COLORS[stage]}15`,
                    borderColor: `${STAGE_COLORS[stage]}30`,
                  }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: STAGE_COLORS[stage] }}>
                      {STAGE_LABELS[stage]}
                    </span>
                    <span className="text-xs font-bold text-white/40">{stageLeads.length}</span>
                  </div>
                  {budget > 0 && (
                    <p className="text-[10px] mt-1" style={{ color: STAGE_COLORS[stage], opacity: 0.6 }}>
                      {fmtPrice(budget)}
                    </p>
                  )}
                </div>

                {/* Cards */}
                <div className="space-y-2 rounded-b-xl border border-t-0 p-2"
                  style={{ background: "rgba(255,255,255,0.01)", borderColor: `${STAGE_COLORS[stage]}15` }}>
                  {stageLeads.length === 0 ? (
                    <p className="text-center py-6 text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>
                      Không có lead
                    </p>
                  ) : (
                    stageLeads.map(lead => (
                      <div key={lead.id}
                        className="rounded-lg border p-3 cursor-pointer transition-all hover:scale-[1.01]"
                        style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
                        onClick={() => {
                          setEditingId(lead.id);
                          setEditingForm({
                            customerName: lead.customerName,
                            customerEmail: lead.customerEmail ?? "",
                            customerPhone: lead.customerPhone ?? "",
                            companyName: lead.companyName ?? "",
                            source: lead.source,
                            area: lead.area,
                            tier: lead.tier,
                            note: lead.note ?? "",
                            estimatedBudget: lead.estimatedBudget?.toString() ?? "",
                          });
                        }}
                      >
                        <p className="text-xs font-semibold text-white truncate">{lead.customerName}</p>
                        {lead.companyName && (
                          <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: "rgba(209,213,219,0.4)" }}>
                            <Building2 size={9} />{lead.companyName}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[9px] rounded px-1 py-0.5"
                            style={{ background: `${SOURCE_COLORS[lead.source] ?? "#6366F1"}25`, color: SOURCE_COLORS[lead.source] ?? "#6366F1" }}>
                            {lead.source}
                          </span>
                          {lead.area && (
                            <span className="text-[9px] text-white/30">{AREA_LABELS[lead.area] ?? lead.area}</span>
                          )}
                        </div>
                        {lead.estimatedBudget && (
                          <p className="text-[10px] mt-1 font-medium" style={{ color: "#10B981" }}>
                            {fmtPrice(lead.estimatedBudget)}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl border p-6 w-full max-w-lg my-8"
            style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}>
            <h2 className="text-lg font-bold text-white mb-4">+ Tạo Sales Lead mới</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>
                    Tên khách hàng *
                  </label>
                  <input value={form.customerName}
                    onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>
                    Công ty
                  </label>
                  <input value={form.companyName}
                    onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>
                    Email
                  </label>
                  <input value={form.customerEmail}
                    onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>
                    Điện thoại
                  </label>
                  <input value={form.customerPhone}
                    onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Nguồn</label>
                  <select value={form.source}
                    onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                    <option value="website">Website</option>
                    <option value="facebook">Facebook</option>
                    <option value="zalo">Zalo</option>
                    <option value="referral">Referral</option>
                    <option value="cold_call">Cold Call</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Khu vực</label>
                  <select value={form.area}
                    onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                    {Object.entries(AREA_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Tier</label>
                  <select value={form.tier}
                    onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                    {Object.entries(TIER_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>
                  Ước tính ngân sách (VND)
                </label>
                <input type="number" value={form.estimatedBudget}
                  onChange={e => setForm(f => ({ ...f, estimatedBudget: e.target.value }))}
                  placeholder="VD: 15000000"
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Ghi chú</label>
                <textarea value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={createLead} disabled={saving}
                className="flex-1 rounded-lg py-2 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: "#6366F1" }}>
                {saving ? "Đang tạo..." : "Tạo Lead"}
              </button>
              <button onClick={() => { setShowCreate(false); setForm(emptyForm); }}
                className="rounded-lg border px-4 py-2 text-sm text-gray-400 border-white/10">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl border p-6 w-full max-w-lg my-8"
            style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}>
            <h2 className="text-lg font-bold text-white mb-4">Chỉnh sửa Lead</h2>
            <div className="space-y-3">
              {/* Stage quick-change */}
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "rgba(209,213,219,0.6)" }}>
                  Trạng thái / Pipeline Stage
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {STAGES.map(stage => (
                    <button key={stage}
                      onClick={() => updateLeadStatus(editingId, stage)}
                      className="rounded-lg border py-1.5 px-2 text-[10px] font-bold transition-all hover:scale-105"
                      style={{
                        borderColor: `${STAGE_COLORS[stage]}50`,
                        color: STAGE_COLORS[stage],
                        background: `${STAGE_COLORS[stage]}10`,
                      }}>
                      {STAGE_LABELS[stage]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Tên</label>
                  <input value={editingForm.customerName ?? ""}
                    onChange={e => setEditingForm(f => ({ ...f, customerName: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Công ty</label>
                  <input value={editingForm.companyName ?? ""}
                    onChange={e => setEditingForm(f => ({ ...f, companyName: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Email</label>
                  <input value={editingForm.customerEmail ?? ""}
                    onChange={e => setEditingForm(f => ({ ...f, customerEmail: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Điện thoại</label>
                  <input value={editingForm.customerPhone ?? ""}
                    onChange={e => setEditingForm(f => ({ ...f, customerPhone: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Nguồn</label>
                  <select value={editingForm.source ?? "website"}
                    onChange={e => setEditingForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                    {["website","facebook","zalo","referral","cold_call"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Khu vực</label>
                  <select value={editingForm.area ?? "can_tho"}
                    onChange={e => setEditingForm(f => ({ ...f, area: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                    {Object.entries(AREA_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Tier</label>
                  <select value={editingForm.tier ?? "sme"}
                    onChange={e => setEditingForm(f => ({ ...f, tier: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                    {Object.entries(TIER_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Ước tính ngân sách (VND)</label>
                <input type="number" value={editingForm.estimatedBudget ?? ""}
                  onChange={e => setEditingForm(f => ({ ...f, estimatedBudget: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Ghi chú</label>
                <textarea value={editingForm.note ?? ""}
                  onChange={e => setEditingForm(f => ({ ...f, note: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/admin/sales-leads/${editingId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        ...editingForm,
                        estimatedBudget: editingForm.estimatedBudget ? parseInt(editingForm.estimatedBudget) : undefined,
                      }),
                    });
                    const json = await res.json();
                    if (!res.ok) throw new Error(json.error);
                    toast.success("Đã cập nhật");
                    setEditingId(null);
                    fetchLeads();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Lỗi");
                  }
                }}
                className="flex-1 rounded-lg py-2 text-sm font-bold text-white"
                style={{ background: "#6366F1" }}>
                Lưu thay đổi
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="rounded-lg border px-4 py-2 text-sm text-gray-400 border-white/10">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
