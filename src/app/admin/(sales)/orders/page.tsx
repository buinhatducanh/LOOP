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
  Search,
  Package,
  Paintbrush,
  Layout,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────

interface SelectedAttribute {
  id: string;
  priceAtOrder: number;
  attribute: { id: string; name: string; nameVi: string; price: number };
}

interface Order {
  id: string;
  orderNumber: string;
  orderType: string; // "package" | "template" | "custom"
  packageId: string | null;
  templateId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  companyName: string | null;
  requirements: string | null;
  brandGuidelines: string | null;
  status: string;
  paymentStatus: string;
  totalAmount: number | null;
  createdAt: string;
  updatedAt: string;
  package: { title: string } | null;
  template: { id: string; name: string; nameVi: string; thumbnail: string | null } | null;
  selectedAttributes: SelectedAttribute[];
}

interface PackageOption {
  id: string;
  title: string;
  price: number | null;
}

interface TemplateOption {
  id: string;
  name: string;
  nameVi: string;
  price: number;
}

interface AttributeOption {
  id: string;
  name: string;
  nameVi: string;
  price: number;
  category: string;
  categoryVi: string;
  isRequired: boolean;
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

const orderTypeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  package: { label: "Gói DV", color: "bg-blue-500/20 text-blue-400", icon: <Package size={12} /> },
  template: { label: "Web Gói", color: "bg-green-500/20 text-green-400", icon: <Layout size={12} /> },
  custom: { label: "Thiết kế riêng", color: "bg-indigo-500/20 text-indigo-400", icon: <Paintbrush size={12} /> },
};

// ─── Helper: get display name for order source ──────────────────

function getOrderSourceName(order: Order): string {
  if (order.orderType === "template" && order.template) return order.template.nameVi;
  if (order.orderType === "package" && order.package) return order.package.title;
  if (order.orderType === "custom") return "Thiết kế theo yêu cầu";
  return "—";
}

// ─── Main Page ──────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [allAttributes, setAllAttributes] = useState<AttributeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [orderTypeFilter, setOrderTypeFilter] = useState("");
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
      if (orderTypeFilter) params.set("orderType", orderTypeFilter);

      const res = await fetch(`/api/admin/orders?${params}`);
      const json = await res.json();
      setOrders(json.data || []);
      setPagination(json.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, paymentFilter, orderTypeFilter]);

  const fetchOptions = useCallback(async () => {
    try {
      const [pkgRes, tplRes, attrRes] = await Promise.all([
        fetch("/api/admin/packages/web-packages?limit=100"),
        fetch("/api/admin/web-templates?limit=100"),
        fetch("/api/admin/service-attributes?limit=200"),
      ]);
      const [pkgJson, tplJson, attrJson] = await Promise.all([
        pkgRes.json(), tplRes.json(), attrRes.json(),
      ]);
      setPackages((pkgJson.data || []).map((p: Record<string, unknown>) => ({
        id: p.id, title: p.title || p.name, price: p.price || null,
      })));
      setTemplates((tplJson.data || []).map((t: Record<string, unknown>) => ({
        id: t.id, name: t.name, nameVi: t.nameVi, price: t.price || 0,
      })));
      setAllAttributes(attrJson.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchOptions();
  }, [fetchOrders, fetchOptions]);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa đơn hàng này?")) return;
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Không thể xóa đơn hàng");
        return;
      }
      toast.success("Đã xóa đơn hàng");
      fetchOrders(pagination.page);
    } catch {
      toast.error("Lỗi kết nối");
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Không thể cập nhật trạng thái");
        return;
      }
      toast.success("Đã cập nhật trạng thái đơn hàng");
      fetchOrders(pagination.page);
      if (detailModal?.id === id) {
        setDetailModal((prev) => prev ? { ...prev, status } : null);
      }
    } catch {
      toast.error("Lỗi kết nối");
    }
  };

  const handlePaymentUpdate = async (id: string, paymentStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Không thể cập nhật thanh toán");
        return;
      }
      toast.success("Đã cập nhật trạng thái thanh toán");
      fetchOrders(pagination.page);
      if (detailModal?.id === id) {
        setDetailModal((prev) => prev ? { ...prev, paymentStatus } : null);
      }
    } catch {
      toast.error("Lỗi kết nối");
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
          value={orderTypeFilter}
          onChange={(e) => setOrderTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
        >
          <option value="">Tất cả loại đơn</option>
          {Object.entries(orderTypeConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
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
        {(statusFilter || paymentFilter || search || orderTypeFilter) && (
          <button
            onClick={() => { setStatusFilter(""); setPaymentFilter(""); setOrderTypeFilter(""); setSearch(""); setSearchInput(""); }}
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
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Dịch vụ / Gói</th>
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
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                    Không có đơn hàng nào
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const sCfg = orderStatuses[order.status] || orderStatuses.pending;
                  const pCfg = paymentStatuses[order.paymentStatus] || paymentStatuses.unpaid;
                  const tCfg = orderTypeConfig[order.orderType] || orderTypeConfig.package;
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-blue-400">{order.orderNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${tCfg.color}`}>
                          {tCfg.icon} {tCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{order.customerName}</p>
                        <p className="text-xs text-slate-500">{order.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-300">{getOrderSourceName(order)}</p>
                        {order.orderType === "custom" && order.selectedAttributes.length > 0 && (
                          <p className="text-[11px] text-slate-500">
                            {order.selectedAttributes.length} tính năng
                          </p>
                        )}
                      </td>
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
          templates={templates}
          allAttributes={allAttributes}
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
  const tCfg = orderTypeConfig[order.orderType] || orderTypeConfig.package;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Chi tiết Đơn hàng</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono text-blue-400">{order.orderNumber}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${tCfg.color}`}>
                {tCfg.icon} {tCfg.label}
              </span>
            </div>
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
              <p className="text-slate-500">Dịch vụ / Gói</p>
              <p className="text-white">{getOrderSourceName(order)}</p>
            </div>
            <div>
              <p className="text-slate-500">Tổng tiền</p>
              <p className="font-mono text-green-400">
                {order.totalAmount ? formatPrice(order.totalAmount) : "—"}
              </p>
            </div>
          </div>

          {/* Template thumbnail */}
          {order.orderType === "template" && order.template?.thumbnail && (
            <div className="text-sm">
              <p className="text-slate-500 mb-1">Mẫu giao diện</p>
              <img
                src={order.template.thumbnail}
                alt={order.template.nameVi}
                className="h-32 w-full rounded-lg border border-slate-700 object-cover"
              />
            </div>
          )}

          {/* Selected attributes (custom orders) */}
          {order.orderType === "custom" && order.selectedAttributes.length > 0 && (
            <div className="text-sm">
              <p className="text-slate-500 mb-2">Tính năng đã chọn ({order.selectedAttributes.length})</p>
              <div className="space-y-1 rounded-lg bg-slate-800 p-3">
                {order.selectedAttributes.map((sa) => (
                  <div key={sa.id} className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <Tag size={12} className="text-indigo-400" />
                      {sa.attribute.nameVi}
                    </span>
                    <span className="text-xs font-mono text-green-400">
                      {sa.priceAtOrder > 0 ? formatPrice(sa.priceAtOrder) : "Miễn phí"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brand guidelines (custom orders) */}
          {order.brandGuidelines && (
            <div className="text-sm">
              <p className="text-slate-500 mb-1">Yêu cầu nhận diện thương hiệu</p>
              <p className="rounded-lg bg-slate-800 p-3 text-slate-300 whitespace-pre-wrap">
                {order.brandGuidelines}
              </p>
            </div>
          )}

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
  templates,
  allAttributes,
  onClose,
  onSaved,
}: {
  editing?: Order;
  packages: PackageOption[];
  templates: TemplateOption[];
  allAttributes: AttributeOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    orderType: editing?.orderType || "template",
    packageId: editing?.packageId || "",
    templateId: editing?.templateId || "",
    customerName: editing?.customerName || "",
    customerEmail: editing?.customerEmail || "",
    customerPhone: editing?.customerPhone || "",
    companyName: editing?.companyName || "",
    requirements: editing?.requirements || "",
    brandGuidelines: editing?.brandGuidelines || "",
    status: editing?.status || "pending",
    paymentStatus: editing?.paymentStatus || "unpaid",
    totalAmount: editing?.totalAmount?.toString() || "",
    attributeIds: editing?.selectedAttributes?.map((sa) => sa.attribute.id) || [],
  });

  // Group attributes by category for the checkbox list
  const groupedAttrs = allAttributes.reduce((acc, attr) => {
    if (!acc[attr.category]) acc[attr.category] = { categoryVi: attr.categoryVi, items: [] };
    acc[attr.category].items.push(attr);
    return acc;
  }, {} as Record<string, { categoryVi: string; items: AttributeOption[] }>);

  const toggleAttr = (id: string) => {
    const attr = allAttributes.find((a) => a.id === id);
    if (attr?.isRequired) return;
    setForm((f) => ({
      ...f,
      attributeIds: f.attributeIds.includes(id)
        ? f.attributeIds.filter((x) => x !== id)
        : [...f.attributeIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/admin/orders/${editing.id}` : "/api/admin/orders";
      const method = editing ? "PUT" : "POST";
      const payload: Record<string, unknown> = {
        orderType: form.orderType,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone || null,
        companyName: form.companyName || null,
        requirements: form.requirements || null,
        status: form.status,
        paymentStatus: form.paymentStatus,
        totalAmount: form.totalAmount ? parseInt(form.totalAmount) : null,
      };

      if (form.orderType === "package") {
        payload.packageId = form.packageId;
        payload.templateId = null;
      } else if (form.orderType === "template") {
        payload.templateId = form.templateId;
        payload.packageId = null;
      } else {
        // custom
        payload.packageId = null;
        payload.templateId = null;
        payload.brandGuidelines = form.brandGuidelines || null;
        payload.attributeIds = form.attributeIds;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lỗi");
      toast.success(editing ? "Đã cập nhật đơn hàng" : "Đã tạo đơn hàng");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm pt-8 pb-8">
      <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">
            {editing ? "Chỉnh sửa Đơn hàng" : "Tạo Đơn hàng mới"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Type Selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              Loại đơn hàng <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              {Object.entries(orderTypeConfig).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, orderType: key }))}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    form.orderType === key
                      ? "border-blue-500 bg-blue-500/10 text-white"
                      : "border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional: Package selector */}
          {form.orderType === "package" && (
            <div>
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
          )}

          {/* Conditional: Template selector */}
          {form.orderType === "template" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Mẫu giao diện <span className="text-red-400">*</span>
              </label>
              <select
                value={form.templateId}
                onChange={(e) => setForm((f) => ({ ...f, templateId: e.target.value }))}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
              >
                <option value="">Chọn mẫu...</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameVi} ({formatPrice(t.price)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Conditional: Custom attributes + brand guidelines */}
          {form.orderType === "custom" && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Yêu cầu nhận diện thương hiệu
                </label>
                <textarea
                  value={form.brandGuidelines}
                  onChange={(e) => setForm((f) => ({ ...f, brandGuidelines: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 resize-none"
                  placeholder="Mô tả bộ nhận diện thương hiệu, màu sắc, phong cách..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Tính năng ({form.attributeIds.length} đã chọn)
                </label>
                <div className="max-h-48 space-y-3 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                  {Object.entries(groupedAttrs).map(([cat, group]) => (
                    <div key={cat}>
                      <p className="mb-1 text-xs font-semibold uppercase text-slate-400">
                        {group.categoryVi}
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {group.items.map((attr) => (
                          <label
                            key={attr.id}
                            className="flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 text-sm text-slate-300 hover:bg-slate-700"
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={form.attributeIds.includes(attr.id) || attr.isRequired}
                                onChange={() => toggleAttr(attr.id)}
                                disabled={attr.isRequired}
                                className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-700 text-blue-500"
                              />
                              {attr.nameVi}
                              {attr.isRequired && (
                                <span className="text-[10px] text-amber-400">(bắt buộc)</span>
                              )}
                            </span>
                            <span className="text-[11px] text-green-400">
                              {attr.price > 0 ? formatPrice(attr.price) : ""}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  {allAttributes.length === 0 && (
                    <p className="text-center text-sm text-slate-500 py-4">
                      Chưa có tính năng nào trong hệ thống
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Customer info */}
          <div className="grid grid-cols-2 gap-4">
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
