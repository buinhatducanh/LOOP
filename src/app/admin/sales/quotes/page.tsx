"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Quote {
  id: string;
  quoteNumber: string;
  title: string;
  totalAmount: number;
  lpAllocation: Record<string, number>;
  status: string;
  validUntil: string | null;
  sentAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  salesLead: { id: string; customerName: string; companyName: string | null };
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft:     { bg: "rgba(100,116,139,0.15)",  color: "#94A3B8" },
  sent:      { bg: "rgba(59,130,246,0.15)",  color: "#3B82F6" },
  approved:  { bg: "rgba(16,185,129,0.15)",  color: "#10B981" },
  rejected:  { bg: "rgba(239,68,68,0.15)",   color: "#EF4444" },
  expired:   { bg: "rgba(245,158,11,0.15)",  color: "#F59E0B" },
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Nháp", sent: "Đã gửi", approved: "Đã duyệt",
  rejected: "Từ chối", expired: "Hết hạn",
};

const LP_ROLES: Record<string, { label: string; color: string }> = {
  sales:  { label: "Sales",  color: "#6366F1" },
  design: { label: "Design", color: "#EC4899" },
  pm:     { label: "PM",     color: "#8B5CF6" },
  dev:    { label: "Dev",    color: "#10B981" },
  qa:     { label: "QA",    color: "#F59E0B" },
  seo:    { label: "SEO",    color: "#14B8A6" },
};

const fmtPrice = (n: number) =>
  Intl.NumberFormat("vi-VN").format(n) + " ₫";

const VI_DATE = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [leads, setLeads] = useState<{ id: string; customerName: string; companyName: string | null }[]>([]);
  const [form, setForm] = useState({
    salesLeadId: "", quoteNumber: "", title: "",
    totalAmount: "", lpSales: "20", lpDesign: "15", lpPm: "15",
    lpDev: "30", lpQa: "10", lpSeo: "10",
    validUntil: "", note: "",
  });

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/quotes?${params}`);
      const json = await res.json();
      setQuotes(json.data ?? []);
    } finally { setLoading(false); }
  }, [search, statusFilter]);

  const fetchLeads = useCallback(async () => {
    const res = await fetch("/api/admin/sales-leads?status=all");
    const json = await res.json();
    setLeads(json.data ?? []);
  }, []);

  useEffect(() => { fetchQuotes(); }, [fetchQuotes]);
  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const createQuote = async () => {
    if (!form.salesLeadId || !form.quoteNumber || !form.title || !form.totalAmount) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    const lp = {
      sales: parseInt(form.lpSales),
      design: parseInt(form.lpDesign),
      pm: parseInt(form.lpPm),
      dev: parseInt(form.lpDev),
      qa: parseInt(form.lpQa),
      seo: parseInt(form.lpSeo),
    };
    const lpSum = Object.values(lp).reduce((s, v) => s + v, 0);
    if (lpSum !== 100) {
      toast.error(`LP allocation phải tổng = 100%. Hiện tại: ${lpSum}%`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salesLeadId: form.salesLeadId,
          quoteNumber: form.quoteNumber,
          title: form.title,
          totalAmount: parseInt(form.totalAmount),
          lpAllocation: lp,
          validUntil: form.validUntil || undefined,
          note: form.note || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Đã tạo báo giá");
      setShowCreate(false);
      setForm({ salesLeadId: "", quoteNumber: "", title: "", totalAmount: "", lpSales: "20", lpDesign: "15", lpPm: "15", lpDev: "30", lpQa: "10", lpSeo: "10", validUntil: "", note: "" });
      fetchQuotes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    } finally { setSaving(false); }
  };

  const totalAmount = quotes.reduce((s, q) => s + q.totalAmount, 0);
  const byStatus = (s: string) => quotes.filter(q => q.status === s).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Báo giá</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            {quotes.length} báo giá · {fmtPrice(totalAmount)} tổng giá trị
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex gap-1">
            {(["all","draft","sent","approved","rejected","expired"] as const).map(s => (
              <button key={s}
                onClick={() => setStatusFilter(s)}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: statusFilter === s ? "rgba(99,102,241,0.15)" : "transparent",
                  borderColor: statusFilter === s ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.1)",
                  color: statusFilter === s ? "#818CF8" : "rgba(209,213,219,0.4)",
                }}>
                {s === "all" ? "Tất cả" : STATUS_LABELS[s]}
                {s !== "all" && ` (${byStatus(s)})`}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreate(true)}
            className="rounded-lg px-4 py-2 text-sm font-bold text-white"
            style={{ background: "#6366F1" }}>
            + Báo giá mới
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {(["draft","sent","approved","rejected","expired"] as const).map(s => {
          const cnt = byStatus(s);
          return (
            <div key={s}
              className="rounded-xl border p-4 text-center"
              style={{ background: STATUS_COLORS[s].bg, borderColor: `${STATUS_COLORS[s].color}30` }}>
              <p className="text-2xl font-black" style={{ color: STATUS_COLORS[s].color }}>{cnt}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>{STATUS_LABELS[s]}</p>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo số báo giá, tiêu đề, khách hàng..."
          className="flex-1 rounded-lg border px-4 py-2 text-sm text-white placeholder-white/30 outline-none"
          style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-xl border p-4 animate-pulse"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="h-4 rounded w-1/3 mb-2" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="h-3 rounded w-1/4" style={{ background: "rgba(255,255,255,0.04)" }} />
            </div>
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-20 rounded-xl border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Chưa có báo giá nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map(quote => {
            const lp = quote.lpAllocation ?? {};
            const lpEntries = Object.entries(lp).filter(([, v]) => v > 0);
            return (
              <div key={quote.id}
                className="rounded-xl border p-5 cursor-pointer transition-all hover:border-white/15"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}
                onClick={() => router.push(`/admin/sales/quotes/${quote.id}`)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <code className="text-xs font-mono text-white/60">{quote.quoteNumber}</code>
                      <span className="text-sm font-semibold text-white truncate">{quote.title}</span>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium border"
                        style={{ ...STATUS_COLORS[quote.status] ?? STATUS_COLORS.draft, borderColor: `${STATUS_COLORS[quote.status]?.color ?? "#94A3B8"}30` }}>
                        {STATUS_LABELS[quote.status] ?? quote.status}
                      </span>
                      {quote.validUntil && new Date(quote.validUntil) < new Date() && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
                          Hết hạn
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
                        {quote.salesLead.customerName}
                      </span>
                      {quote.salesLead.companyName && (
                        <span className="text-[10px]" style={{ color: "rgba(209,213,219,0.25)" }}>
                          · {quote.salesLead.companyName}
                        </span>
                      )}
                      <span className="text-[10px]" style={{ color: "rgba(209,213,219,0.2)" }}>
                        · {VI_DATE.format(new Date(quote.createdAt))}
                      </span>
                    </div>

                    {/* LP Allocation bar */}
                    {lpEntries.length > 0 && (
                      <div className="mt-3">
                        <div className="flex gap-0.5 h-3 rounded-full overflow-hidden">
                          {lpEntries.map(([role, pct]) => (
                            <div key={role}
                              title={`${LP_ROLES[role]?.label ?? role}: ${pct}%`}
                              style={{
                                width: `${pct}%`,
                                background: LP_ROLES[role]?.color ?? "#6366F1",
                              }}
                            />
                          ))}
                        </div>
                        <div className="flex gap-3 mt-1.5">
                          {lpEntries.map(([role, pct]) => (
                            <span key={role} className="text-[10px] flex items-center gap-1"
                              style={{ color: LP_ROLES[role]?.color ?? "#94A3B8" }}>
                              <span className="w-1.5 h-1.5 rounded-full inline-block"
                                style={{ background: LP_ROLES[role]?.color ?? "#94A3B8" }} />
                              {LP_ROLES[role]?.label ?? role} {pct}%
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xl font-black text-white">{fmtPrice(quote.totalAmount)}</p>
                    {quote.validUntil && (
                      <p className="text-[10px] mt-1" style={{ color: "rgba(209,213,219,0.3)" }}>
                        Hạn: {VI_DATE.format(new Date(quote.validUntil))}
                      </p>
                    )}
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
          <div className="rounded-2xl border p-6 w-full max-w-2xl my-8"
            style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}>
            <h2 className="text-lg font-bold text-white mb-4">📋 Tạo Báo giá mới</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>
                    Khách hàng (Lead) *
                  </label>
                  <select value={form.salesLeadId}
                    onChange={e => setForm(f => ({ ...f, salesLeadId: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                    <option value="">— Chọn lead —</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.customerName}{l.companyName ? ` · ${l.companyName}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>
                    Số báo giá *
                  </label>
                  <input value={form.quoteNumber}
                    onChange={e => setForm(f => ({ ...f, quoteNumber: e.target.value }))}
                    placeholder="VD: Q-2026-001"
                    className="w-full rounded-lg border px-3 py-2 text-sm text-white font-mono"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>
                  Tiêu đề báo giá *
                </label>
                <input value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="VD: Báo giá Website CoffeeShop Brand"
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>
                  Tổng giá trị (VND) *
                </label>
                <input type="number" value={form.totalAmount}
                  onChange={e => setForm(f => ({ ...f, totalAmount: e.target.value }))}
                  placeholder="VD: 15000000"
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>

              {/* LP Allocation */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium" style={{ color: "rgba(209,213,219,0.6)" }}>
                    Phân bổ LP theo team
                  </label>
                  {(() => {
                    const sum = [form.lpSales, form.lpDesign, form.lpPm, form.lpDev, form.lpQa, form.lpSeo]
                      .map(Number).reduce((s, v) => s + v, 0);
                    return (
                      <span className="text-[10px] font-bold"
                        style={{ color: sum === 100 ? "#10B981" : "#EF4444" }}>
                        Tổng: {sum}% {sum !== 100 && "(phải = 100%)"}
                      </span>
                    );
                  })()}
                </div>
                <div className="space-y-2">
                  {(["sales","design","pm","dev","qa","seo"] as const).map(role => {
                    const label = LP_ROLES[role].label;
                    const color = LP_ROLES[role].color;
                    const key = `lp${role.charAt(0).toUpperCase() + role.slice(1)}` as keyof typeof form;
                    return (
                      <div key={role} className="flex items-center gap-3">
                        <span className="text-xs w-16 shrink-0" style={{ color }}>{label}</span>
                        <input
                          type="range" min="0" max="100" step="5"
                          value={form[key] as string}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                          style={{ accentColor: color, background: `${color}30` }}
                        />
                        <input
                          type="number" min="0" max="100"
                          value={form[key] as string}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                          className="w-12 rounded border px-2 py-1 text-xs text-white text-center"
                          style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
                        />
                        <span className="text-xs w-4 text-right" style={{ color }}>%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>
                  Hạn báo giá
                </label>
                <input type="date" value={form.validUntil}
                  onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
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
              <button onClick={createQuote} disabled={saving}
                className="flex-1 rounded-lg py-2 text-sm font-bold text-white disabled:opacity-40"
                style={{ background: "#6366F1" }}>
                {saving ? "Đang tạo..." : "Tạo báo giá"}
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
