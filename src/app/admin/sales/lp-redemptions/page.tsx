"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";

const VI_DATE = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
});

interface AddonService {
  id: string;
  name: string;
  nameVi: string | null;
  slug: string;
  lpCost: number | null;
  type: string;
  billingPeriod: string | null;
  icon: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string | null;
  availableLp: number;
}

interface Redemption {
  id: string;
  memberId: string;
  addonId: string;
  quantity: number;
  lpCost: number;
  totalCost: number;
  newBalance: number;
  createdAt: string;
  addon: { name: string; nameVi: string | null; icon: string | null };
  member: { id: string; name: string; role: string; image: string | null } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

type Tab = "catalog" | "history";

export default function LpRedemptionsPage() {
  const [tab, setTab] = useState<Tab>("catalog");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [catalog, setCatalog] = useState<AddonService[]>([]);
  const [history, setHistory] = useState<Redemption[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);

  // Redeem form state
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedAddon, setSelectedAddon] = useState<AddonService | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [redeeming, setRedeeming] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  const fetchCatalog = useCallback(async () => {
    const res = await fetch("/api/admin/lp-redemptions?items=1");
    const json = await res.json();
    setCatalog(json.data ?? []);
  }, []);

  const fetchMembers = useCallback(async () => {
    const res = await fetch("/api/admin/team?limit=100");
    const json = await res.json();
    setMembers(json.data ?? []);
  }, []);

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (selectedMember) params.set("memberId", selectedMember.id);
    const res = await fetch(`/api/admin/lp-redemptions?${params}`);
    const json = await res.json();
    setHistory(json.data ?? []);
    if (json.pagination) setPagination(json.pagination);
    setLoading(false);
  }, [selectedMember]);

  useEffect(() => {
    fetchCatalog();
    fetchMembers();
    fetchHistory();
  }, [fetchCatalog, fetchMembers, fetchHistory]);

  const handleRedeem = async () => {
    if (!selectedMember || !selectedAddon) return;
    const cost = (selectedAddon.lpCost ?? 0) * quantity;
    if (selectedMember.availableLp < cost) {
      toast.error(`Số dư không đủ. Cần ${cost} LP, hiện có ${selectedMember.availableLp} LP.`);
      return;
    }
    setRedeeming(true);
    try {
      const res = await fetch("/api/admin/lp-redemptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember.id,
          addonId: selectedAddon.id,
          quantity,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Lỗi khi đổi LP");
      toast.success(`Đã đổi ${cost} LP cho ${selectedMember.name}`);
      setSelectedAddon(null);
      setQuantity(1);
      fetchMembers();
      fetchHistory();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi đổi LP");
    } finally {
      setRedeeming(false);
    }
  };

  const filteredMembers = members.filter(m =>
    !memberSearch || m.name.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const totalCost = (selectedAddon?.lpCost ?? 0) * quantity;
  const canRedeem = selectedMember && selectedAddon && quantity > 0 && totalCost <= (selectedMember.availableLp ?? 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Đổi LP</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
          Thành viên đổi LP lấy quà tặng
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {([["catalog", "Danh mục quà"], ["history", "Lịch sử đổi"]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className="rounded-lg px-5 py-2.5 text-sm font-medium transition-all"
            style={{
              background: tab === t ? "rgba(139,92,246,0.2)" : "transparent",
              borderColor: tab === t ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.1)",
              borderWidth: 1, borderStyle: "solid",
              color: tab === t ? "#fff" : "rgba(209,213,219,0.5)",
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Catalog Tab ─────────────────────────────────────────────────── */}
      {tab === "catalog" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Redeem form */}
          <div className="space-y-4">
            <div className="rounded-xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
              <h2 className="text-sm font-semibold text-white mb-4">Đổi LP cho thành viên</h2>

              {/* Member selector */}
              <div className="mb-4">
                <label className="block text-xs mb-1.5" style={{ color: "rgba(209,213,219,0.5)" }}>Thành viên</label>
                <div className="relative">
                  <input
                    value={memberSearch || (selectedMember?.name ?? "")}
                    onChange={e => { setMemberSearch(e.target.value); setSelectedMember(null); }}
                    onFocus={() => setMemberSearch("")}
                    placeholder="Tìm thành viên..."
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
                  />
                  {memberSearch && filteredMembers.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border shadow-xl overflow-hidden"
                      style={{ background: "#1e1e2e", borderColor: "rgba(255,255,255,0.1)" }}>
                      {filteredMembers.slice(0, 6).map(m => (
                        <button key={m.id}
                          onClick={() => { setSelectedMember(m); setMemberSearch(""); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5 transition-colors">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: ["#6366F1","#EC4899","#F59E0B","#10B981","#06B6D4"][Math.abs(m.name.charCodeAt(0)) % 5] }}>
                            {m.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{m.name}</p>
                            <p className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
                              ⬡{m.availableLp?.toLocaleString() ?? 0} LP
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedMember && (
                  <div className="mt-2 flex items-center gap-2 p-2 rounded-lg"
                    style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: "#6366F1" }}>
                      {selectedMember.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{selectedMember.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-purple-400">⬡{selectedMember.availableLp?.toLocaleString() ?? 0}</p>
                      <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>sẵn có</p>
                    </div>
                    <button onClick={() => setSelectedMember(null)}
                      className="text-slate-400 hover:text-white ml-1 shrink-0">✕</button>
                  </div>
                )}
              </div>

              {/* Addon selector */}
              <div className="mb-4">
                <label className="block text-xs mb-1.5" style={{ color: "rgba(209,213,219,0.5)" }}>Chọn quà</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {catalog.map(addon => (
                    <button key={addon.id}
                      onClick={() => setSelectedAddon(addon)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all"
                      style={{
                        background: selectedAddon?.id === addon.id ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${selectedAddon?.id === addon.id ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)"}`,
                      }}>
                      <span className="text-xl shrink-0">{addon.icon ?? "🎁"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {addon.nameVi ?? addon.name}
                        </p>
                        {addon.billingPeriod && (
                          <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                            {addon.billingPeriod}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-purple-400 shrink-0">
                        ⬡{(addon.lpCost ?? 0).toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              {selectedAddon && (
                <div className="mb-4">
                  <label className="block text-xs mb-1.5" style={{ color: "rgba(209,213,219,0.5)" }}>Số lượng</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-9 h-9 rounded-lg border flex items-center justify-center text-white font-bold hover:bg-white/5"
                      style={{ borderColor: "rgba(255,255,255,0.1)" }}>−</button>
                    <input type="number" min={1} value={quantity}
                      onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 rounded-lg border text-center py-2 text-sm text-white outline-none"
                      style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                    <button onClick={() => setQuantity(q => q + 1)}
                      className="w-9 h-9 rounded-lg border flex items-center justify-center text-white font-bold hover:bg-white/5"
                      style={{ borderColor: "rgba(255,255,255,0.1)" }}>+</button>
                  </div>
                </div>
              )}

              {/* Cost preview */}
              {selectedAddon && selectedMember && (
                <div className="mb-4 p-3 rounded-lg space-y-1"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "rgba(209,213,219,0.5)" }}>Đơn giá</span>
                    <span className="text-white">⬡{(selectedAddon.lpCost ?? 0).toLocaleString()} × {quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-white">Tổng cộng</span>
                    <span style={{ color: totalCost > (selectedMember.availableLp ?? 0) ? "#EF4444" : "#A78BFA" }}>
                      ⬡{totalCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: "rgba(209,213,219,0.5)" }}>Sau khi đổi</span>
                    <span className="text-green-400">⬡{Math.max(0, (selectedMember.availableLp ?? 0) - totalCost).toLocaleString()}</span>
                  </div>
                  {totalCost > (selectedMember.availableLp ?? 0) && (
                    <p className="text-xs text-red-400 mt-1">Số dư không đủ để đổi</p>
                  )}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleRedeem}
                disabled={!canRedeem || redeeming}
                className="w-full rounded-lg py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: canRedeem ? "#7C3AED" : "#374151" }}>
                {redeeming ? "Đang xử lý..." : `Đổi LP ⬡${totalCost.toLocaleString()}`}
              </button>
            </div>
          </div>

          {/* Right: Catalog grid */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "rgba(209,213,219,0.6)" }}>
              Danh mục quà tặng ({catalog.length})
            </h2>
            {catalog.length === 0 ? (
              <EmptyState icon="🎁" message="Chưa có quà tặng nào" description="Thêm AddonService với lpCost để bắt đầu." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {catalog.map(addon => (
                  <div key={addon.id}
                    className="rounded-xl border p-4 flex items-start gap-3"
                    style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                    <span className="text-2xl shrink-0">{addon.icon ?? "🎁"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {addon.nameVi ?? addon.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(209,213,219,0.4)" }}>
                        {addon.type === "recurring" ? "📅 Định kỳ" : "📦 Một lần"}
                        {addon.billingPeriod ? ` · ${addon.billingPeriod}` : ""}
                      </p>
                      <p className="text-base font-black mt-1" style={{ color: "#A78BFA" }}>
                        ⬡{(addon.lpCost ?? 0).toLocaleString()} LP
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── History Tab ─────────────────────────────────────────────────── */}
      {tab === "history" && (
        <div className="space-y-4">
          {/* Member filter */}
          <div className="flex items-center gap-3">
            <select
              value={selectedMember?.id ?? ""}
              onChange={e => {
                const m = members.find(x => x.id === e.target.value);
                setSelectedMember(m ?? null);
              }}
              className="rounded-lg border px-3 py-2 text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
              <option value="">Tất cả thành viên</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <button onClick={() => fetchHistory(1)}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              Làm mới
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {([
              { label: "Tổng đơn", value: pagination.total, color: "#6366F1" },
              { label: "Trang hiện tại", value: history.length, color: "#10B981" },
              { label: "Tổng LP đã đổi", value: history.reduce((s, h) => s + h.totalCost, 0), color: "#F59E0B" },
            ] as const).map(stat => (
              <div key={stat.label} className="rounded-xl border p-4 text-center"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                <p className="text-2xl font-black" style={{ color: stat.color }}>
                  {stat.label.includes("LP") ? "⬡" : ""}{stat.value.toLocaleString()}
                </p>
                <p className="text-xs mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <EmptyState icon="⏳" message="Đang tải..." />
          ) : history.length === 0 ? (
            <EmptyState icon="📋" message="Chưa có lượt đổi nào" description="Lịch sử đổi LP sẽ xuất hiện ở đây." />
          ) : (
            <>
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      {["Thành viên", "Quà tặng", "SL", "Tổng LP", "Số dư mới", "Ngày"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium"
                          style={{ color: "rgba(209,213,219,0.4)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(r => (
                      <tr key={r.id} className="border-b last:border-0"
                        style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                              style={{ background: ["#6366F1","#EC4899","#F59E0B","#10B981","#06B6D4"][Math.abs(r.memberId?.charCodeAt(0) ?? 0) % 5] }}>
                              {(r.member?.name ?? "?").slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-white font-medium">{r.member?.name ?? "—"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{r.addon?.name ?? r.addonId}</td>
                        <td className="px-4 py-3 text-center text-slate-300">{r.quantity}</td>
                        <td className="px-4 py-3 font-bold text-purple-400">⬡{r.totalCost.toLocaleString()}</td>
                        <td className="px-4 py-3 text-green-400">⬡{r.newBalance.toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-400">{VI_DATE.format(new Date(r.createdAt))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => fetchHistory(pagination.page - 1)} disabled={pagination.page <= 1}
                    className="rounded-lg border px-3 py-1.5 text-sm text-white disabled:opacity-30 hover:bg-white/5"
                    style={{ borderColor: "rgba(255,255,255,0.1)" }}>← Trước</button>
                  <span className="text-sm text-slate-400">Trang {pagination.page} / {pagination.pages}</span>
                  <button onClick={() => fetchHistory(pagination.page + 1)} disabled={pagination.page >= pagination.pages}
                    className="rounded-lg border px-3 py-1.5 text-sm text-white disabled:opacity-30 hover:bg-white/5"
                    style={{ borderColor: "rgba(255,255,255,0.1)" }}>Sau →</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
