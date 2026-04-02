"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { qk } from "@/lib/query/provider";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  X, CheckCircle2, Eye, ChevronRight, Search,
  RefreshCw,
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending_payment: { label: "Chờ thanh toán", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  paid:            { label: "Đã thanh toán",    color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  in_progress:    { label: "Đang thực hiện",   color: "#818CF8", bg: "rgba(129,140,248,0.1)" },
  demo_ready:      { label: "Demo sẵn sàng",    color: "#A78BFA", bg: "rgba(167,139,250,0.1)" },
  client_review:  { label: "Khách review",     color: "#60A5FA", bg: "rgba(96,165,250,0.1)" },
  done:            { label: "Hoàn thành",        color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  cancelled:       { label: "Đã hủy",           color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

const STATUS_FLOW = ["pending_payment", "paid", "in_progress", "demo_ready", "client_review", "done"];

type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  total: number;
  status: string;
  createdAt: string;
  package?: { title: string };
};

function OrderRow({
  order,
  onTransition,
  onDetail,
}: {
  order: Order;
  onTransition: (id: string, currentStatus: string) => void;
  onDetail: (order: Order) => void;
}) {
  const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: DS.text4, bg: "transparent" };

  const fmt = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: DS.bgCard,
        border: `1px solid ${DS.border}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        transition: "border-color 0.2s",
      }}
    >
      {/* Status dot */}
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0, boxShadow: `0 0 6px ${cfg.color}` }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: DS.text, fontWeight: 600, fontSize: 14, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {order.customerName}
        </p>
        <p style={{ color: DS.text4, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {order.package?.title ?? order.customerEmail}
        </p>
      </div>

      {/* Amount */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ color: DS.text, fontWeight: 700, fontSize: 14 }}>{fmt(order.total)}</p>
        <span style={{ color: cfg.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>{cfg.label}</span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        {((): React.ReactNode => {
          const idx = STATUS_FLOW.indexOf(order.status);
          const next = STATUS_FLOW[idx + 1];
          if (!next) return null;
          return (
            <button
              onClick={() => onTransition(order.id, order.status)}
              title={`Chuyển → ${STATUS_CONFIG[next]?.label ?? ""}`}
              style={{
                background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
                borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.green,
                display: "flex", alignItems: "center", fontSize: 11, fontFamily: DS.mono,
              }}
            >
              <ChevronRight size={12} />
            </button>
          );
        })()}
        <button
          onClick={() => onDetail(order)}
          title="Chi tiết"
          style={{
            background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)",
            borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: DS.blue,
            display: "flex", alignItems: "center",
          }}
        >
          <Eye size={13} />
        </button>
      </div>
    </motion.div>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order | null; onClose: () => void }) {
  if (!order) return null;
  const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: DS.text4, bg: "transparent" };
  const fmt = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24, width: "100%", maxWidth: 520 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{order.customerName}</h3>
              <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{order.customerEmail}</p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Gói dịch vụ", value: order.package?.title ?? "—" },
              { label: "Tổng tiền", value: fmt(order.total) },
              { label: "Trạng thái", value: cfg.label, color: cfg.color },
              { label: "Ngày tạo", value: new Date(order.createdAt).toLocaleDateString("vi-VN") },
            ].map((item) => (
              <div key={item.label} style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px 14px" }}>
                <p style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 4 }}>{item.label.toUpperCase()}</p>
                <p style={{ color: (item as { color?: string }).color ?? DS.text, fontWeight: 600, fontSize: 14 }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
            <span style={{ color: cfg.color, fontSize: 12, fontFamily: DS.mono, fontWeight: 600 }}>{cfg.label}</span>
          </div>

          <div style={{ display: "flex", gap: STATUS_FLOW.length, flexWrap: "wrap", marginBottom: 20, padding: "12px", background: DS.bg, borderRadius: 10 }}>
            {STATUS_FLOW.map((s, i) => {
              const sc = STATUS_CONFIG[s];
              const isActive = s === order.status;
              const isPast = STATUS_FLOW.indexOf(order.status) > i;
              return (
                <div key={s} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: isPast ? 0.5 : 1 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: isActive ? sc.color : "transparent", border: `2px solid ${isActive ? sc.color : DS.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isPast && <CheckCircle2 size={12} style={{ color: DS.green }} />}
                  </div>
                  <span style={{ color: isActive ? sc.color : DS.text4, fontSize: 9, fontFamily: DS.mono, textAlign: "center", maxWidth: 50 }}>{sc.label.split(" ")[0]}</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={onClose}
            style={{ width: "100%", padding: "10px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 13 }}
          >
            Đóng
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function OrdersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: qk.orders({ page, limit: 20, search, status: statusFilter }),
    queryFn: async () => {
      const res = await adminApi.get<{ data: Order[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        "/api/admin/orders",
        { params: { page, limit: 20, ...(search ? { search } : {}), ...(statusFilter ? { status: statusFilter } : {}) } }
      );
      return res;
    },
  });

  const orders = data?.data ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const transition = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await adminApi.put<{ data: Order }>(`/api/admin/orders/${id}`, { status });
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.orders() }),
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, marginBottom: 2 }}>Quản lý đơn hàng</h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
            {pagination?.total ?? 0} đơn hàng
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: qk.orders({ page }) })}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
        >
          <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Làm mới
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "8px 12px 8px 36px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: DS.body }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "8px 12px", color: DS.text3, fontSize: 13, outline: "none", cursor: "pointer", fontFamily: DS.mono }}
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_FLOW.map((s) => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
      </div>

      {/* Status chips */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {STATUS_FLOW.map((s) => {
          const cfg = STATUS_CONFIG[s];
          const count = orders.filter((o) => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
              style={{
                padding: "4px 12px", borderRadius: 9999,
                border: `1px solid ${statusFilter === s ? cfg.color : DS.border}`,
                background: statusFilter === s ? cfg.bg : "transparent",
                color: statusFilter === s ? cfg.color : DS.text4,
                fontSize: 11, fontFamily: DS.mono, cursor: "pointer", fontWeight: statusFilter === s ? 700 : 400,
              }}
            >
              {cfg.label} {count > 0 && <span>({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}

      {/* Order list */}
      {!isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {orders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4, fontSize: 14 }}>
              Chưa có đơn hàng nào
            </div>
          ) : (
            orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                onTransition={(id, currentStatus) => {
                  const idx = STATUS_FLOW.indexOf(currentStatus);
                  const next = STATUS_FLOW[idx + 1];
                  if (next) transition.mutate({ id, status: next });
                }}
                onDetail={setSelectedOrder}
              />
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: `1px solid ${page === p ? DS.blue : DS.border}`,
                background: page === p ? "rgba(59,130,246,0.1)" : "transparent",
                color: page === p ? DS.blue : DS.text4,
                cursor: "pointer", fontSize: 13, fontFamily: DS.mono,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Detail modal */}
      <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </div>
  );
}
