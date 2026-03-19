"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/data-table";
import { FilterBar, type FilterDef } from "@/app/[locale]/admin/components/filter-bar";
import { Eye, CheckCircle, Clock, ArrowUpRight, X } from "lucide-react";
import { toast } from "sonner";

interface QuoteRequest {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  companyName: string | null;
  selectedItems: Array<{
    featureName: string;
    variantName: string;
    price: number;
  }>;
  totalAmount: number;
  notes: string | null;
  status: string;
  createdAt: string;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN").format(price) + " ₫";

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  new: {
    label: "Mới",
    color: "bg-blue-500/20 text-blue-400",
    icon: <Clock size={12} />,
  },
  contacted: {
    label: "Đã liên hệ",
    color: "bg-amber-500/20 text-amber-400",
    icon: <ArrowUpRight size={12} />,
  },
  converted: {
    label: "Đã chuyển đổi",
    color: "bg-green-500/20 text-green-400",
    icon: <CheckCircle size={12} />,
  },
};

export default function AdminQuoteRequestsPage() {
  return (
    <Suspense>
      <AdminQuoteRequestsContent />
    </Suspense>
  );
}

function AdminQuoteRequestsContent() {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1, limit: 20, total: 0, totalPages: 0,
  });
  const [filterValues, setFilterValues] = useState<Record<string, string | string[]>>({});
  const [detailModal, setDetailModal] = useState<QuoteRequest | null>(null);

  const filterValuesRef = useRef(filterValues);
  useEffect(() => { filterValuesRef.current = filterValues; }, [filterValues]);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      for (const [key, val] of Object.entries(filterValuesRef.current)) {
        if (val && val !== "all" && val !== "__all__") params.set(key, String(val));
      }
      const res = await fetch(`/api/admin/quote-requests?${params}`);
      const json = await res.json();
      setRequests(json.data || []);
      setPagination(json.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/quote-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Cập nhật thất bại");
        return;
      }
      toast.success("Cập nhật trạng thái thành công");
      fetchData(pagination.page);
      if (detailModal?.id === id) {
        setDetailModal((prev) => prev ? { ...prev, status } : null);
      }
    } catch (e) {
      toast.error("Lỗi kết nối");
    }
  };

  const columns: ColumnDef<QuoteRequest, unknown>[] = [
    {
      accessorKey: "customerName",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-white">{row.original.customerName}</p>
          <p className="text-xs text-slate-500">{row.original.customerEmail}</p>
        </div>
      ),
    },
    {
      accessorKey: "companyName",
      header: "Công ty",
      cell: ({ row }) => (
        <span className="text-slate-300">{row.original.companyName || "—"}</span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Tổng tiền",
      cell: ({ row }) => (
        <span className="font-mono text-green-400">
          {formatPrice(row.original.totalAmount)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const cfg = statusConfig[row.original.status] || statusConfig.new;
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.color}`}
          >
            {cfg.icon} {cfg.label}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Ngày gửi",
      cell: ({ row }) => (
        <span className="text-slate-400 text-xs">
          {new Date(row.original.createdAt).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <button
          onClick={() => setDetailModal(row.original)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-400"
        >
          <Eye size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Yêu cầu Báo giá</h1>
        <p className="text-sm text-slate-400">
          Quản lý các yêu cầu báo giá từ khách hàng
        </p>
      </div>

      <FilterBar
        filters={[
          {
            key: "status",
            label: "Trạng thái",
            type: "select",
            options: [
              { value: "new", label: "Mới" },
              { value: "reviewed", label: "Đã review" },
              { value: "quoted", label: "Đã báo giá" },
              { value: "accepted", label: "Chấp nhận" },
              { value: "rejected", label: "Từ chối" },
            ],
          },
          { key: "createdAt", label: "Ngày tạo", type: "date-range" },
        ]}
        onChange={(vals) => {
          setFilterValues(vals);
          fetchData(1);
        }}
      />

      <DataTable
        data={requests}
        columns={columns}
        loading={loading}
        searchPlaceholder="Tìm yêu cầu..."
        pagination={pagination}
        onSearch={() => {}}
        onPageChange={(page) => fetchData(page)}
      />

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Chi tiết Yêu cầu Báo giá</h2>
              <button
                onClick={() => setDetailModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Tên</p>
                  <p className="text-white font-medium">{detailModal.customerName}</p>
                </div>
                <div>
                  <p className="text-slate-500">Email</p>
                  <p className="text-white">{detailModal.customerEmail}</p>
                </div>
                <div>
                  <p className="text-slate-500">SĐT</p>
                  <p className="text-white">{detailModal.customerPhone || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Công ty</p>
                  <p className="text-white">{detailModal.companyName || "—"}</p>
                </div>
              </div>

              {detailModal.notes && (
                <div className="text-sm">
                  <p className="text-slate-500 mb-1">Ghi chú</p>
                  <p className="text-slate-300 rounded-lg bg-slate-800 p-3">
                    {detailModal.notes}
                  </p>
                </div>
              )}

              {/* Selected Items */}
              <div>
                <p className="text-sm text-slate-500 mb-2">Tính năng đã chọn</p>
                <div className="rounded-lg border border-slate-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-800/50 text-left text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="px-3 py-2">Tính năng</th>
                        <th className="px-3 py-2">Cấp độ</th>
                        <th className="px-3 py-2 text-right">Giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detailModal.selectedItems || []).map((item, i) => (
                        <tr key={i} className="border-t border-slate-800/50 text-slate-300">
                          <td className="px-3 py-2">{item.featureName}</td>
                          <td className="px-3 py-2">{item.variantName}</td>
                          <td className="px-3 py-2 text-right font-mono text-green-400">
                            {formatPrice(item.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-700 bg-slate-800/30">
                        <td colSpan={2} className="px-3 py-2 font-semibold text-white">
                          Tổng cộng
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-green-400">
                          {formatPrice(detailModal.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <p className="text-sm text-slate-500 mb-2">Cập nhật trạng thái</p>
                <div className="flex gap-2">
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => updateStatus(detailModal.id, key)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        detailModal.status === key
                          ? cfg.color + " ring-1 ring-current"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
