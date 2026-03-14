"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShoppingCart,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  CreditCard,
  Search,
  Filter,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface Order {
  id: string;
  orderNumber: string;
  packageId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  companyName: string | null;
  requirements: string | null;
  status: string;
  paymentStatus: string;
  totalAmount: number | null;
  createdAt: string;
  updatedAt: string;
  package: { title: string };
}

interface PackageOption {
  id: string;
  title: string;
  price: number | null;
}

// ─── Constants ──────────────────────────────────────────────────

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN").format(price) + " ₫";

const orderStatuses: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Chờ xử lý", color: "bg-yellow-500/20 text-yellow-400", icon: <Clock size={12} /> },
  confirmed: { label: "Đã xác nhận", color: "bg-blue-500/20 text-blue-400", icon: <CheckCircle size={12} /> },
  in_progress: { label: "Đang thực hiện", color: "bg-indigo-500/20 text-indigo-400", icon: <Loader2 size={12} /> },
  review: { label: "Chờ review", color: "bg-purple-500/20 text-purple-400", icon: <Eye size={12} /> },
  completed: { label: "Hoàn thành", color: "bg-green-500/20 text-green-400", icon: <CheckCircle size={12} /> },
  cancelled: { label: "Đã hủy", color: "bg-red-500/20 text-red-400", icon: <XCircle size={12} /> },
};

const paymentStatuses: Record<string, { label: string; color: string }> = {
  unpaid: { label: "Chưa thanh toán", color: "bg-red-500/20 text-red-400" },
  partial: { label: "Thanh toán một phần", color: "bg-amber-500/20 text-amber-400" },
  paid: { label: "Đã thanh toán", color: "bg-green-500/20 text-green-400" },
  refunded: { label: "Đã hoàn tiền", color: "bg-slate-500/20 text-slate-400" },
};

// ─── Main Page ──────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Modal states
  const [detailModal, setDetailModal] = useState<Order | null>(null);
  const [formModal, setFormModal] = useState<{ open: boolean; editing?: Order }>({ open: false });

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (paymentFilter) params.set("paymentStatus", paymentFilter);

      const res = await fetch(`/api/admin/orders?${params}`);
      const json = await res.json();
      setOrders(json.data || []);
      setPagination(json.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, paymentFilter]);

  const fetchPackages = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/packages/web-packages?limit=100");
      const json = await res.json();
      setPackages((json.data || []).map((p: PackageOption & { price?: number }) => ({
        id: p.id,
        title: p.title,
        price: p.price || null,
      })));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchPackages();
  }, [fetchOrders, fetchPackages]);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa đơn hàng này?")) return;
    try {
      await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
      fetchOrders(pagination.page);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchOrders(pagination.page);
      if (detailModal?.id === id) {
        setDetailModal((prev) => prev ? { ...prev, status } : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePaymentUpdate = async (id: string, paymentStatus: string) => {
    try {
      await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      });
      fetchOrders(pagination.page);
      if (detailModal?.id === id) {
        setDetailModal((prev) => prev ? { ...prev, paymentStatus } : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Status summary
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Đơn hàng</h1>
          <p className="text-sm text-slate-400">
            Theo dõi và xử lý đơn hàng ({pagination.total} đơn)
          </p>
        </div>
        <button
          onClick={() => setFormModal({ open: true })}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          Tạo đơn hàng
        </button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Object.entries(orderStatuses).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? "" : key)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              statusFilter === key
                ? "border-blue-500 bg-blue-500/10"
                : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                {cfg.icon}
              </span>
              <span className="text-xs text-slate-400">{cfg.label}</span>
            </div>
            <p className="mt-1 text-lg font-bold text-white">{statusCounts[key] || 0}</p>
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput)}
            placeholder="Tìm theo tên, email, mã đơn..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
        >
          <option value="">Tất cả thanh toán</option>
          {Object.entries(paymentStatuses).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        {(statusFilter || paymentFilter || search) && (
          <button
            onClick={() => { setStatusFilter(""); setPaymentFilter(""); setSearch(""); setSearchInput(""); }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <X size={14} />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/30 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Gói dịch vụ</th>
                <th className="px-4 py-3">Tổng tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Thanh toán</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                    Không có đơn hàng nào
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const sCfg = orderStatuses[order.status] || orderStatuses.pending;
                  const pCfg = paymentStatuses[order.paymentStatus] || paymentStatuses.unpaid;
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-blue-400">{order.orderNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{order.customerName}</p>
                        <p className="text-xs text-slate-500">{order.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{order.package.title}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-green-400">
                          {order.totalAmount ? formatPrice(order.totalAmount) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${sCfg.color}`}>
                          {sCfg.icon} {sCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${pCfg.color}`}>
                          {pCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailModal(order)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-400 transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => setFormModal({ open: true, editing: order })}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">
            <p className="text-xs text-slate-500">
              Trang {pagination.page}/{pagination.totalPages} ({pagination.total} đơn)
            </p>
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(pagination.totalPages, 5) }).map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => fetchOrders(page)}
                    className={`h-8 min-w-[32px] rounded-lg px-2.5 text-xs font-medium transition-colors ${
                      pagination.page === page
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <DetailModal
          order={detailModal}
          onClose={() => setDetailModal(null)}
          onStatusChange={handleStatusUpdate}
          onPaymentChange={handlePaymentUpdate}
        />
      )}

      {/* Form Modal */}
      {formModal.open && (
        <OrderFormModal
          editing={formModal.editing}
          packages={packages}
          onClose={() => setFormModal({ open: false })}
          onSaved={() => fetchOrders(pagination.page)}
        />
      )}
    </div>
  );
}

// ─── Detail Modal ───────────────────────────────────────────────

function DetailModal({
  order,
  onClose,
  onStatusChange,
  onPaymentChange,
}: {
  order: Order;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onPaymentChange: (id: string, paymentStatus: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Chi tiết Đơn hàng</h2>
            <p className="text-xs font-mono text-blue-400">{order.orderNumber}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Customer info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Khách hàng</p>
              <p className="font-medium text-white">{order.customerName}</p>
            </div>
            <div>
              <p className="text-slate-500">Email</p>
              <p className="text-white">{order.customerEmail}</p>
            </div>
            <div>
              <p className="text-slate-500">SĐT</p>
              <p className="text-white">{order.customerPhone || "—"}</p>
            </div>
            <div>
              <p className="text-slate-500">Công ty</p>
              <p className="text-white">{order.companyName || "—"}</p>
            </div>
            <div>
              <p className="text-slate-500">Gói dịch vụ</p>
              <p className="text-white">{order.package.title}</p>
            </div>
            <div>
              <p className="text-slate-500">Tổng tiền</p>
              <p className="font-mono text-green-400">
                {order.totalAmount ? formatPrice(order.totalAmount) : "—"}
              </p>
            </div>
          </div>

          {/* Requirements */}
          {order.requirements && (
            <div className="text-sm">
              <p className="text-slate-500 mb-1">Yêu cầu</p>
              <p className="rounded-lg bg-slate-800 p-3 text-slate-300 whitespace-pre-wrap">
                {order.requirements}
              </p>
            </div>
          )}

          {/* Status workflow */}
          <div>
            <p className="text-sm text-slate-500 mb-2">Trạng thái đơn hàng</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(orderStatuses).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => onStatusChange(order.id, key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    order.status === key
                      ? cfg.color + " ring-1 ring-current"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment status */}
          <div>
            <p className="text-sm text-slate-500 mb-2">Thanh toán</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(paymentStatuses).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => onPaymentChange(order.id, key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    order.paymentStatus === key
                      ? cfg.color + " ring-1 ring-current"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="flex gap-4 text-xs text-slate-500 border-t border-slate-800 pt-3">
            <span>Tạo: {new Date(order.createdAt).toLocaleString("vi-VN")}</span>
            <span>Cập nhật: {new Date(order.updatedAt).toLocaleString("vi-VN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Order Form Modal ───────────────────────────────────────────

function OrderFormModal({
  editing,
  packages,
  onClose,
  onSaved,
}: {
  editing?: Order;
  packages: PackageOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    packageId: editing?.packageId || (packages[0]?.id || ""),
    customerName: editing?.customerName || "",
    customerEmail: editing?.customerEmail || "",
    customerPhone: editing?.customerPhone || "",
    companyName: editing?.companyName || "",
    requirements: editing?.requirements || "",
    status: editing?.status || "pending",
    paymentStatus: editing?.paymentStatus || "unpaid",
    totalAmount: editing?.totalAmount?.toString() || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/admin/orders/${editing.id}` : "/api/admin/orders";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          totalAmount: form.totalAmount ? parseInt(form.totalAmount) : null,
        }),
      });
      if (res.ok) {
        onSaved();
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm pt-8 pb-8">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">
            {editing ? "Chỉnh sửa Đơn hàng" : "Tạo Đơn hàng mới"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Gói dịch vụ <span className="text-red-400">*</span>
              </label>
              <select
                value={form.packageId}
                onChange={(e) => setForm((f) => ({ ...f, packageId: e.target.value }))}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="">Chọn gói...</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} {p.price ? `(${formatPrice(p.price)})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Tên khách hàng <span className="text-red-400">*</span>
              </label>
              <input
                value={form.customerName}
                onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">SĐT</label>
              <input
                value={form.customerPhone}
                onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="0912 345 678"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Công ty</label>
              <input
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="Tên công ty"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Tổng tiền (VNĐ)</label>
              <input
                type="number"
                value={form.totalAmount}
                onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
                placeholder="5000000"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Trạng thái</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
              >
                {Object.entries(orderStatuses).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Yêu cầu</label>
              <textarea
                value={form.requirements}
                onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 resize-none"
                placeholder="Mô tả yêu cầu của khách hàng..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {editing ? "Cập nhật" : "Tạo đơn"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
