"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, ChevronDown, ChevronUp, RefreshCw,
  TrendingUp, Gift, Users, Award, ArrowUpDown
} from "lucide-react";

interface PointCustomer {
  id: string;
  userEmail: string;
  userName: string | null;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  level: number;
  currentXp: number;
  loginStreak: number;
  lastLoginDate: string | null;
  createdAt: string;
  _count: { transactions: number };
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    source: string;
    description: string;
    createdAt: string;
    referenceType: string | null;
  }>;
}

interface PointsStats {
  totalCustomers: number;
  totalLpAwarded: number;
  totalLpSpent: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

function XPBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((current / max) * 100) : 0;
  return (
    <div className="rounded-full overflow-hidden" style={{ height: 4, background: "#1F2937" }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)`, boxShadow: `0 0 6px ${color}` }}
      />
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const cfg: Record<string, { label: string; bg: string; text: string }> = {
    earn: { label: "EARN", bg: "#10B98122", text: "#10B981" },
    spend: { label: "SPEND", bg: "#EF444422", text: "#EF4444" },
    expire: { label: "EXPIRE", bg: "#F59E0B22", text: "#F59E0B" },
    refund: { label: "REFUND", bg: "#3B82F622", text: "#3B82F6" },
  };
  const s = cfg[type] ?? { label: type.toUpperCase(), bg: "#64748B22", text: "#64748B" };
  return (
    <span
      className="px-1.5 py-0.5 rounded text-xs font-mono font-bold"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

export default function AdminPointsPage() {
  const [customers, setCustomers] = useState<PointCustomer[]>([]);
  const [stats, setStats] = useState<PointsStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [emailSearch, setEmailSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<PointCustomer | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPage, setDetailPage] = useState(1);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDesc, setAdjustDesc] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(emailSearch), 400);
    return () => clearTimeout(t);
  }, [emailSearch]);

  const fetchCustomers = useCallback(async (page = 1, search = debouncedSearch) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("email", search);
      const res = await fetch(`/api/admin/customer-points?${params}`);
      const data = await res.json();
      if (data.data) {
        setCustomers(data.data);
        setStats(data.stats);
        setPagination(data.pagination ?? { page, limit: 20, total: 0, pages: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openCustomer = async (c: PointCustomer) => {
    setSelectedCustomer(c);
    setDetailPage(1);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/customer-points/${c.id}?page=1&limit=20`);
      const data = await res.json();
      if (data.data) setSelectedCustomer({ ...data.data, transactions: data.data.transactions ?? [] });
    } finally {
      setDetailLoading(false);
    }
  };

  const loadMoreDetail = async () => {
    if (!selectedCustomer) return;
    const next = detailPage + 1;
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/customer-points/${selectedCustomer.id}?page=${next}&limit=20`);
      const data = await res.json();
      if (data.data) {
        setSelectedCustomer({
          ...selectedCustomer,
          transactions: [...(selectedCustomer.transactions ?? []), ...(data.data.transactions ?? [])],
        });
        setDetailPage(next);
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAdjust = async () => {
    if (!selectedCustomer || !adjustAmount) return;
    const amount = parseInt(adjustAmount, 10);
    if (isNaN(amount) || amount === 0) { setAdjustError("Enter a non-zero number"); return; }

    setAdjustLoading(true);
    setAdjustError("");
    try {
      const res = await fetch("/api/admin/customer-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: selectedCustomer.userEmail, amount, description: adjustDesc }),
      });
      const data = await res.json();
      if (!res.ok) { setAdjustError(data.error ?? "Adjustment failed"); return; }

      // Refresh customer
      await openCustomer({ ...selectedCustomer, balance: data.data.balance });
      setAdjustAmount("");
      setAdjustDesc("");
    } catch {
      setAdjustError("Network error");
    } finally {
      setAdjustLoading(false);
    }
  };

  const sourceColor = (src: string) => {
    const map: Record<string, string> = {
      purchase: "#10B981", referral: "#818CF8", upgrade: "#F59E0B",
      daily_login: "#3B82F6", watch_ad: "#06B6D4", admin: "#EF4444",
      refund: "#8B5CF6",
    };
    return map[src] ?? "#64748B";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Award size={22} style={{ color: "#818CF8" }} />
            Customer Points
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage customer LP — balances, transactions, referral rewards</p>
        </div>
        <button
          onClick={() => fetchCustomers(pagination.page)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-slate-400 border border-slate-700 hover:border-slate-500 hover:text-white transition-all"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Customers", value: stats.totalCustomers.toLocaleString(), icon: <Users size={16} />, color: "#818CF8" },
            { label: "Total LP Awarded", value: stats.totalLpAwarded.toLocaleString(), icon: <TrendingUp size={16} />, color: "#10B981" },
            { label: "Total LP Spent", value: stats.totalLpSpent.toLocaleString(), icon: <Gift size={16} />, color: "#EF4444" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-2 mb-2" style={{ color: s.color }}>
                {s.icon}
                <span className="text-xs font-mono uppercase tracking-widest">{s.label}</span>
              </div>
              <div className="text-2xl font-bold text-white font-mono">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search by email..."
          value={emailSearch}
          onChange={(e) => setEmailSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {["Customer", "Balance", "Total Earned", "Level", "XP", "Streak", "Transactions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-500">Loading...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-500">No customers found</td></tr>
              ) : (
                customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/20 cursor-pointer transition-colors"
                    onClick={() => openCustomer(c)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{c.userName ?? "—"}</div>
                      <div className="text-xs text-slate-500 font-mono">{c.userEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-emerald-400">{c.balance.toLocaleString()}</span>
                      <span className="text-xs text-slate-500 ml-1">LP</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">{c.totalEarned.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-400">Lv{c.level}</td>
                    <td className="px-4 py-3 min-w-32">
                      <div className="text-xs text-slate-400 mb-1 font-mono">{c.currentXp} / {c.level * 100} XP</div>
                      <XPBar current={c.currentXp} max={c.level * 100} color="#818CF8" />
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-1.5 py-0.5 rounded text-xs font-mono font-bold"
                        style={{ background: c.loginStreak > 0 ? "#F59E0B22" : "#1F2937", color: c.loginStreak > 0 ? "#F59E0B" : "#374151" }}>
                        {c.loginStreak > 0 ? `🔥 ${c.loginStreak}d` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs font-mono">{c._count.transactions} total</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <span className="text-xs text-slate-500 font-mono">
              Page {pagination.page} of {pagination.pages} — {pagination.total} customers
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchCustomers(pagination.page - 1)}
                className="px-3 py-1 rounded text-xs border border-slate-700 text-slate-400 disabled:opacity-30 hover:border-slate-500 transition-all"
              >
                ← Prev
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchCustomers(pagination.page + 1)}
                className="px-3 py-1 rounded text-xs border border-slate-700 text-slate-400 disabled:opacity-30 hover:border-slate-500 transition-all"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedCustomer(null); }}
        >
          <div
            className="w-full max-w-lg h-full overflow-y-auto bg-slate-900 border-l border-slate-800 flex flex-col"
            style={{ boxShadow: "-20px 0 60px rgba(0,0,0,0.5)" }}
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedCustomer.userName ?? "Customer"}</h2>
                  <p className="text-sm text-slate-400 font-mono">{selectedCustomer.userEmail}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Since {new Date(selectedCustomer.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="w-8 h-8 flex items-center justify-center rounded border border-slate-700 text-slate-500 hover:text-white hover:border-slate-500 transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Balance card */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "Balance", value: selectedCustomer.balance.toLocaleString(), color: "#10B981" },
                  { label: "Total Earned", value: selectedCustomer.totalEarned.toLocaleString(), color: "#818CF8" },
                  { label: "Total Spent", value: selectedCustomer.totalSpent.toLocaleString(), color: "#EF4444" },
                ].map((b) => (
                  <div key={b.label} className="rounded-lg border border-slate-800 p-3 text-center">
                    <div className="text-xs text-slate-500 mb-1 font-mono">{b.label}</div>
                    <div className="font-mono font-bold text-base" style={{ color: b.color }}>{b.value}</div>
                    <div className="text-xs text-slate-600">LP</div>
                  </div>
                ))}
              </div>

              {/* Level */}
              <div className="rounded-lg border border-slate-800 p-3 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono text-slate-500">Level {selectedCustomer.level}</span>
                  <span className="text-xs font-mono text-slate-500">{selectedCustomer.currentXp} / {selectedCustomer.level * 100} XP</span>
                </div>
                <XPBar current={selectedCustomer.currentXp} max={selectedCustomer.level * 100} color="#818CF8" />
              </div>

              {/* Adjust */}
              <div className="rounded-lg border border-slate-800 p-3">
                <div className="text-xs font-mono text-slate-500 mb-2">ADMIN ADJUSTMENT</div>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    placeholder="± LP amount"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-sm font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleAdjust}
                    disabled={adjustLoading || !adjustAmount}
                    className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm disabled:opacity-40 hover:bg-indigo-500 transition-all font-mono"
                  >
                    {adjustLoading ? "..." : "Apply"}
                  </button>
                </div>
                {adjustError && <div className="text-xs text-red-400 mb-2 font-mono">{adjustError}</div>}
                <input
                  type="text"
                  placeholder="Reason / note (optional)"
                  value={adjustDesc}
                  onChange={(e) => setAdjustDesc(e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-slate-800 border border-slate-700 text-white text-sm font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500 mb-2"
                />
                <p className="text-xs text-slate-600">Max ±100,000 LP per adjustment</p>
              </div>
            </div>

            {/* Transaction History */}
            <div className="flex-1 p-6">
              <div className="flex items-center gap-2 mb-4">
                <ArrowUpDown size={14} className="text-slate-500" />
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Transaction History</span>
              </div>

              {detailLoading ? (
                <div className="text-center py-8 text-slate-500">Loading transactions...</div>
              ) : !selectedCustomer.transactions || selectedCustomer.transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">No transactions yet</div>
              ) : (
                <div className="space-y-2">
                  {selectedCustomer.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-800/60 hover:border-slate-700/60 transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <TypeBadge type={tx.type} />
                          <span
                            className="text-xs font-mono font-bold"
                            style={{ color: tx.amount >= 0 ? "#10B981" : "#EF4444" }}
                          >
                            {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString()} LP
                          </span>
                          <span
                            className="px-1 py-0.5 rounded text-xs font-mono"
                            style={{ background: `${sourceColor(tx.source)}22`, color: sourceColor(tx.source) }}
                          >
                            {tx.source}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono truncate">{tx.description}</div>
                        <div className="text-xs text-slate-600 mt-0.5 font-mono">
                          {new Date(tx.createdAt).toLocaleString("vi-VN")}
                        </div>
                      </div>
                    </div>
                  ))}

                  {detailPage < 10 && (
                    <button
                      onClick={loadMoreDetail}
                      className="w-full py-2 rounded border border-slate-800 text-xs text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-all font-mono"
                    >
                      Load more...
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
