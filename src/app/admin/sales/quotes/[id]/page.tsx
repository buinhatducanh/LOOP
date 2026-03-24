"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
  signedAt: string | null;
  milestones: Array<{ name: string; amount: number; dueDate?: string }> | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  salesLead: {
    id: string; customerName: string; customerEmail: string | null;
    customerPhone: string | null; companyName: string | null; area: string; tier: string;
  };
  order: { id: string; orderNumber: string; status: string; totalAmount: number } | null;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft:    { bg: "rgba(100,116,139,0.15)",  color: "#94A3B8" },
  sent:     { bg: "rgba(59,130,246,0.15)",  color: "#3B82F6" },
  approved: { bg: "rgba(16,185,129,0.15)",  color: "#10B981" },
  rejected: { bg: "rgba(239,68,68,0.15)",   color: "#EF4444" },
  expired:  { bg: "rgba(245,158,11,0.15)",  color: "#F59E0B" },
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
  qa:     { label: "QA",     color: "#F59E0B" },
  seo:    { label: "SEO",    color: "#14B8A6" },
};

const fmtPrice = (n: number) =>
  Intl.NumberFormat("vi-VN").format(n) + " ₫";

const VI_DATE = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const VI_DATETIME = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/quotes/${id}`);
      const json = await res.json();
      setQuote(json.data ?? null);
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchQuote(); }, [fetchQuote]);

  const doAction = async (action: "send" | "approve" | "reject") => {
    setActionLoading(action);
    try {
      const res = await fetch(`/api/admin/quotes/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      if (action === "send") toast.success("Đã gửi báo giá cho khách");
      if (action === "approve") {
        toast.success("Đã duyệt báo giá! Đơn hàng đã được tạo.");
        if (json.order) {
          setTimeout(() => router.push(`/admin/sales/orders`), 1500);
        }
      }
      if (action === "reject") toast.success("Đã từ chối báo giá");
      fetchQuote();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi");
    } finally { setActionLoading(null); }
  };

  if (loading || !quote) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 rounded animate-pulse mb-6" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="h-48 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
      </div>
    );
  }

  const lp = quote.lpAllocation ?? {};
  const lpEntries = Object.entries(lp).filter(([, v]) => v > 0);
  const lpSum = Object.values(lp).reduce((s, v) => s + v, 0);
  const isExpired = quote.validUntil ? new Date(quote.validUntil) < new Date() : false;

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <button onClick={() => router.back()}
        className="text-sm transition-colors hover:text-white"
        style={{ color: "rgba(209,213,219,0.4)" }}>
        ← Quay lại danh sách
      </button>

      {/* Header */}
      <div className="rounded-xl border p-6"
        style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <code className="text-xs font-mono px-2 py-0.5 rounded"
                style={{ background: "rgba(99,102,241,0.15)", color: "#818CF8" }}>
                {quote.quoteNumber}
              </code>
              <h1 className="text-xl font-bold text-white">{quote.title}</h1>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-medium border"
                style={{ ...STATUS_COLORS[quote.status] ?? STATUS_COLORS.draft,
                  borderColor: `${(STATUS_COLORS[quote.status] ?? STATUS_COLORS.draft).color}30` }}>
                {STATUS_LABELS[quote.status] ?? quote.status}
              </span>
              {isExpired && quote.status === "sent" && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
                  Hết hạn
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
              <span>{quote.salesLead.customerName}</span>
              {quote.salesLead.companyName && <span>· {quote.salesLead.companyName}</span>}
              <span>· {VI_DATE.format(new Date(quote.createdAt))}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-black text-white">{fmtPrice(quote.totalAmount)}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(209,213,219,0.3)" }}>Tổng giá trị</p>
          </div>
        </div>

        {/* Action buttons */}
        {quote.status === "draft" && (
          <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <button onClick={() => doAction("send")}
              disabled={actionLoading !== null}
              className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              style={{ background: "#3B82F6" }}>
              ✉ {actionLoading === "send" ? "Đang gửi..." : "Gửi báo giá"}
            </button>
            <button onClick={() => doAction("approve")}
              disabled={actionLoading !== null}
              className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              style={{ background: "#10B981" }}>
              ✓ {actionLoading === "approve" ? "Đang duyệt..." : "Duyệt & Tạo Order"}
            </button>
            <button onClick={() => doAction("reject")}
              disabled={actionLoading !== null}
              className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{ borderColor: "rgba(239,68,68,0.4)", color: "#EF4444" }}>
              ✗ {actionLoading === "reject" ? "Đang từ chối..." : "Từ chối"}
            </button>
          </div>
        )}
        {quote.status === "sent" && (
          <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <button onClick={() => doAction("approve")}
              disabled={actionLoading !== null}
              className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              style={{ background: "#10B981" }}>
              ✓ {actionLoading === "approve" ? "Đang duyệt..." : "Duyệt & Tạo Order"}
            </button>
            <button onClick={() => doAction("reject")}
              disabled={actionLoading !== null}
              className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{ borderColor: "rgba(239,68,68,0.4)", color: "#EF4444" }}>
              ✗ {actionLoading === "reject" ? "Đang từ chối..." : "Từ chối"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: LP Allocation + Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* LP Allocation */}
          <div className="rounded-xl border p-5"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Phân bổ LP theo Team</h2>
              <span className="text-xs font-bold"
                style={{ color: lpSum === 100 ? "#10B981" : "#EF4444" }}>
                Tổng: {lpSum}%
              </span>
            </div>

            {lpEntries.length > 0 ? (
              <>
                {/* LP Bar */}
                <div className="flex gap-0.5 h-6 rounded-full overflow-hidden mb-4">
                  {lpEntries.map(([role, pct]) => (
                    <div key={role} title={`${LP_ROLES[role]?.label ?? role}: ${pct}%`}
                      style={{ width: `${pct}%`, background: LP_ROLES[role]?.color ?? "#6366F1" }} />
                  ))}
                </div>

                {/* LP breakdown grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {lpEntries.map(([role, pct]) => {
                    const color = LP_ROLES[role]?.color ?? "#6366F1";
                    const label = LP_ROLES[role]?.label ?? role;
                    const amount = Math.round((quote.totalAmount * pct) / 100);
                    return (
                      <div key={role} className="rounded-lg border p-3"
                        style={{ background: `${color}08`, borderColor: `${color}20` }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold" style={{ color }}>{label}</span>
                          <span className="text-sm font-black" style={{ color }}>{pct}%</span>
                        </div>
                        <p className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
                          {fmtPrice(amount)}
                        </p>
                        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-center py-6" style={{ color: "rgba(209,213,219,0.3)" }}>
                Chưa có phân bổ LP
              </p>
            )}
          </div>

          {/* Milestones */}
          {quote.milestones && quote.milestones.length > 0 && (
            <div className="rounded-xl border p-5"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
              <h2 className="text-sm font-semibold text-white mb-4">Payment Milestones</h2>
              <div className="space-y-3">
                {quote.milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{ background: "rgba(99,102,241,0.2)", color: "#818CF8" }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{m.name}</p>
                      <p className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>
                        {m.dueDate ? `Hạn: ${VI_DATE.format(new Date(m.dueDate))}` : "Không có hạn"}
                      </p>
                    </div>
                    <p className="text-sm font-semibold shrink-0" style={{ color: "#10B981" }}>
                      {fmtPrice(m.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          {quote.note && (
            <div className="rounded-xl border p-5"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
              <h2 className="text-sm font-semibold text-white mb-2">Ghi chú</h2>
              <p className="text-sm" style={{ color: "rgba(209,213,219,0.6)" }}>{quote.note}</p>
            </div>
          )}
        </div>

        {/* Right: Customer Info + Timeline */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="rounded-xl border p-5"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
            <h2 className="text-sm font-semibold text-white mb-4">Khách hàng</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>Tên</p>
                <p className="text-sm font-medium text-white">{quote.salesLead.customerName}</p>
              </div>
              {quote.salesLead.companyName && (
                <div>
                  <p className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>Công ty</p>
                  <p className="text-sm text-white">{quote.salesLead.companyName}</p>
                </div>
              )}
              {quote.salesLead.customerEmail && (
                <div>
                  <p className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>Email</p>
                  <p className="text-sm text-white">{quote.salesLead.customerEmail}</p>
                </div>
              )}
              {quote.salesLead.customerPhone && (
                <div>
                  <p className="text-xs" style={{ color: "rgba(209,213,219,0.4)" }}>Điện thoại</p>
                  <p className="text-sm text-white">{quote.salesLead.customerPhone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border p-5"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
            <h2 className="text-sm font-semibold text-white mb-4">Timeline</h2>
            <div className="space-y-4">
              {[
                { label: "Tạo", date: quote.createdAt },
                { label: "Gửi", date: quote.sentAt },
                { label: "Duyệt", date: quote.approvedAt },
                { label: "Ký", date: quote.signedAt },
              ].map(({ label, date }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: date ? "#10B981" : "rgba(255,255,255,0.15)" }} />
                  <div className="flex-1">
                    <p className="text-xs" style={{ color: date ? "rgba(209,213,219,0.6)" : "rgba(209,213,219,0.2)" }}>
                      {label}
                    </p>
                    {date && (
                      <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.3)" }}>
                        {VI_DATETIME.format(new Date(date))}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {quote.validUntil && (
                <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: isExpired ? "#EF4444" : "#F59E0B" }} />
                  <div>
                    <p className="text-xs" style={{ color: isExpired ? "#EF4444" : "rgba(209,213,219,0.4)" }}>
                      Hạn báo giá
                    </p>
                    <p className="text-[10px]" style={{ color: isExpired ? "#EF4444" : "rgba(209,213,219,0.3)" }}>
                      {VI_DATE.format(new Date(quote.validUntil))} {isExpired ? "(hết hạn)" : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order link */}
          {quote.order && (
            <div className="rounded-xl border p-5"
              style={{ background: "rgba(16,185,129,0.05)", borderColor: "rgba(16,185,129,0.2)" }}>
              <h2 className="text-xs font-semibold mb-2" style={{ color: "#10B981" }}>Đơn hàng đã tạo</h2>
              <p className="text-sm font-mono text-white">{quote.order.orderNumber}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(209,213,219,0.4)" }}>
                {fmtPrice(quote.order.totalAmount)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
