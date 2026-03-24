"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface Contract {
  id: string;
  projectId: string;
  title: string;
  price: number;
  billingCycle: string;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  status: string;
  renewalReminderSent: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  project: { id: string; orderNumber: string; customerName: string; companyName: string | null };
}

interface Project { id: string; orderNumber: string; customerName: string; }

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  active:         { bg: "rgba(16,185,129,0.12)",  color: "#10B981", label: "Hoạt động" },
  expiring_soon:  { bg: "rgba(245,158,11,0.12)", color: "#F59E0B", label: "Sắp hết hạn" },
  expired:        { bg: "rgba(239,68,68,0.12)",   color: "#EF4444", label: "Đã hết hạn" },
  cancelled:      { bg: "rgba(100,116,139,0.12)", color: "#94A3B8", label: "Đã hủy" },
};

const CYCLE_LABELS: Record<string, string> = {
  monthly: "Hàng tháng", quarterly: "Hàng quý", yearly: "Hàng năm",
};

const fmtPrice = (n: number) =>
  Intl.NumberFormat("vi-VN").format(n) + " ₫";

const VI_DATE = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

function daysUntil(date: string): number {
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function UrgencyBadge({ endDate }: { endDate: string }) {
  const days = daysUntil(endDate);
  if (days < 0) return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
      style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
      Hết hạn {Math.abs(days)}d
    </span>
  );
  if (days <= 7) return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
      style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
      Còn {days}d
    </span>
  );
  if (days <= 30) return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
      style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>
      Còn {days}d
    </span>
  );
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
      style={{ background: "rgba(16,185,129,0.12)", color: "#10B981" }}>
      Còn {days}d
    </span>
  );
}

export default function MaintenancePage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    projectId: "", title: "", price: "", billingCycle: "monthly",
    startDate: "", endDate: "", autoRenew: false, note: "",
  });

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/maintenance-contracts?${params}`);
      const json = await res.json();
      setContracts(json.data ?? []);
    } finally { setLoading(false); }
  }, [statusFilter]);

  const fetchProjects = useCallback(async () => {
    const res = await fetch("/api/admin/orders?status=all");
    const json = await res.json();
    setProjects(json.data ?? []);
  }, []);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);
  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const createContract = async () => {
    if (!form.projectId || !form.title || !form.price || !form.startDate || !form.endDate) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/maintenance-contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: form.projectId,
          title: form.title,
          price: parseInt(form.price),
          billingCycle: form.billingCycle,
          startDate: form.startDate,
          endDate: form.endDate,
          autoRenew: form.autoRenew,
          note: form.note || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Đã tạo hợp đồng bảo trì");
      setShowCreate(false);
      setForm({ projectId: "", title: "", price: "", billingCycle: "monthly", startDate: "", endDate: "", autoRenew: false, note: "" });
      fetchContracts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    } finally { setSaving(false); }
  };

  const renewContract = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/maintenance-contracts/${id}/renew`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Đã gia hạn hợp đồng!");
      fetchContracts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/maintenance-contracts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Đã cập nhật trạng thái");
      fetchContracts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    }
  };

  const deleteContract = async (id: string) => {
    if (!confirm("Xóa hợp đồng bảo trì này?")) return;
    try {
      const res = await fetch(`/api/admin/maintenance-contracts/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Đã xóa hợp đồng");
      fetchContracts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    }
  };

  const activeContracts = contracts.filter(c => c.status === "active");
  const expiringContracts = contracts.filter(c => c.status === "expiring_soon");
  const expiredContracts = contracts.filter(c => c.status === "expired");
  const monthlyRevenue = activeContracts.reduce((s, c) => {
    const monthly = c.billingCycle === "monthly" ? c.price
      : c.billingCycle === "quarterly" ? Math.round(c.price / 3)
      : Math.round(c.price / 12);
    return s + monthly;
  }, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Hợp đồng Bảo trì</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            {contracts.length} hợp đồng · {fmtPrice(monthlyRevenue)}/tháng doanh thu recurring
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1">
            {(["all","active","expiring_soon","expired","cancelled"] as const).map(s => (
              <button key={s}
                onClick={() => setStatusFilter(s)}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: statusFilter === s ? "rgba(99,102,241,0.15)" : "transparent",
                  borderColor: statusFilter === s ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.1)",
                  color: statusFilter === s ? "#818CF8" : "rgba(209,213,219,0.4)",
                }}>
                {s === "all" ? "Tất cả" : STATUS_COLORS[s]?.label ?? s}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreate(true)}
            className="rounded-lg px-4 py-2 text-sm font-bold text-white"
            style={{ background: "#6366F1" }}>
            + Hợp đồng mới
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {([
          { label: "Hoạt động", count: activeContracts.length, color: "#10B981" },
          { label: "Sắp hết hạn", count: expiringContracts.length, color: "#F59E0B" },
          { label: "Đã hết hạn", count: expiredContracts.length, color: "#EF4444" },
          { label: "MRR (tháng)", count: fmtPrice(monthlyRevenue), color: "#8B5CF6" },
        ] as const).map(s => (
          <div key={s.label}
            className="rounded-xl border p-4 text-center"
            style={{ background: `${s.color}08`, borderColor: `${s.color}20` }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.count}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-xl border p-5 animate-pulse"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="h-4 rounded w-1/3 mb-2" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="h-3 rounded w-1/4" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
          ))}
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-20 rounded-xl border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-4xl mb-3">🔧</p>
          <p className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Chưa có hợp đồng bảo trì nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map(contract => {
            const sc = STATUS_COLORS[contract.status] ?? STATUS_COLORS.active;
            const days = daysUntil(contract.endDate);
            return (
              <div key={contract.id}
                className="rounded-xl border p-5 transition-all hover:border-white/12"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-semibold text-white">{contract.title}</h3>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium border"
                        style={{ ...sc, borderColor: `${sc.color}30` }}>
                        {sc.label}
                      </span>
                      {contract.autoRenew && (
                        <span className="text-[10px] rounded px-1.5 py-0.5"
                          style={{ background: "rgba(139,92,246,0.12)", color: "#A78BFA" }}>
                          Auto-renew
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: "rgba(209,213,219,0.4)" }}>
                      <span>{contract.project.customerName}</span>
                      {contract.project.companyName && <span>· {contract.project.companyName}</span>}
                      <span>· <code className="font-mono">{contract.project.orderNumber}</code></span>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <div className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
                        <span style={{ color: "#10B981" }} className="font-bold">{fmtPrice(contract.price)}</span>
                        /{CYCLE_LABELS[contract.billingCycle] ?? contract.billingCycle}
                      </div>
                      <div className="text-xs" style={{ color: "rgba(209,213,219,0.3)" }}>
                        {VI_DATE.format(new Date(contract.startDate))} → {VI_DATE.format(new Date(contract.endDate))}
                      </div>
                      <UrgencyBadge endDate={contract.endDate} />
                    </div>

                    {contract.note && (
                      <p className="text-xs mt-2" style={{ color: "rgba(209,213,219,0.35)" }}>
                        {contract.note}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    {contract.status !== "expired" && (
                      <button
                        onClick={() => renewContract(contract.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                        style={{ background: "#10B981" }}>
                        🔄 Gia hạn
                      </button>
                    )}
                    {contract.status === "active" && (
                      <button
                        onClick={() => updateStatus(contract.id, "expiring_soon")}
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                        style={{ borderColor: "rgba(245,158,11,0.4)", color: "#F59E0B" }}>
                        ⚠️ Sắp hết
                      </button>
                    )}
                    {contract.status === "active" && (
                      <button
                        onClick={() => updateStatus(contract.id, "cancelled")}
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                        style={{ borderColor: "rgba(100,116,139,0.4)", color: "#94A3B8" }}>
                        Hủy
                      </button>
                    )}
                    <button
                      onClick={() => deleteContract(contract.id)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium"
                      style={{ borderColor: "rgba(239,68,68,0.3)", color: "rgba(239,68,68,0.7)" }}>
                      ✕
                    </button>
                  </div>
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
            <h2 className="text-lg font-bold text-white mb-4">🔧 Tạo Hợp đồng Bảo trì</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>
                  Dự án *
                </label>
                <select value={form.projectId}
                  onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                  <option value="">— Chọn dự án —</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.customerName} · {p.orderNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>
                  Tiêu đề hợp đồng *
                </label>
                <input value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="VD: Bảo trì Website CoffeeShop 2026"
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>
                    Phí bảo trì (VND) *
                  </label>
                  <input type="number" value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="VD: 1500000"
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>
                    Chu kỳ thanh toán
                  </label>
                  <select value={form.billingCycle}
                    onChange={e => setForm(f => ({ ...f, billingCycle: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                    <option value="monthly">Hàng tháng</option>
                    <option value="quarterly">Hàng quý</option>
                    <option value="yearly">Hàng năm</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>
                    Ngày bắt đầu *
                  </label>
                  <input type="date" value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>
                    Ngày kết thúc *
                  </label>
                  <input type="date" value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.autoRenew}
                  onChange={e => setForm(f => ({ ...f, autoRenew: e.target.checked }))}
                  className="w-4 h-4 rounded" style={{ accentColor: "#6366F1" }} />
                <span className="text-sm" style={{ color: "rgba(209,213,219,0.7)" }}>
                  Tự động gia hạn (Auto-renew)
                </span>
              </label>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>
                  Ghi chú
                </label>
                <textarea value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white resize-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={createContract} disabled={saving}
                className="flex-1 rounded-lg py-2 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: "#6366F1" }}>
                {saving ? "Đang tạo..." : "Tạo hợp đồng"}
              </button>
              <button onClick={() => setShowCreate(false)}
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
