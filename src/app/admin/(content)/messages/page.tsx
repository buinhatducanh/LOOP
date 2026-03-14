"use client";

import { useEffect, useState, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/data-table";
import { Mail, CheckCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  status: string;
  createdAt: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  new: { label: "Mới", color: "bg-blue-500/20 text-blue-400" },
  read: { label: "Đã đọc", color: "bg-slate-500/20 text-slate-400" },
  replied: { label: "Đã trả lời", color: "bg-green-500/20 text-green-400" },
  archived: { label: "Lưu trữ", color: "bg-yellow-500/20 text-yellow-400" },
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = useCallback(async (page = 1, status = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);

      const res = await fetch(`/api/admin/messages?${params}`);
      const data = await res.json();
      setMessages(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      toast.error("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
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
      fetchData(pagination.page, statusFilter);
    } catch (e) {
      toast.error("Lỗi kết nối");
    }
  }

  async function deleteMessage(id: string) {
    if (!confirm("Xoá tin nhắn này?")) return;
    try {
      const res = await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Xóa thất bại");
        return;
      }
      toast.success("Xóa tin nhắn thành công");
      fetchData(pagination.page, statusFilter);
    } catch (e) {
      toast.error("Lỗi kết nối");
    }
  }

  const columns: ColumnDef<Message, unknown>[] = [
    {
      accessorKey: "name",
      header: "Người gửi",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-white">{row.original.name}</p>
          <p className="text-xs text-slate-500">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: "service",
      header: "Dịch vụ",
      cell: ({ row }) => (
        <span className="text-slate-300">{row.original.service || "—"}</span>
      ),
    },
    {
      accessorKey: "message",
      header: "Nội dung",
      cell: ({ row }) => (
        <p className="max-w-xs truncate text-slate-300">{row.original.message}</p>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const s = statusMap[row.original.status] || { label: row.original.status, color: "bg-slate-700 text-slate-300" };
        return (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>
            {s.label}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Ngày",
      cell: ({ row }) => (
        <span className="text-xs text-slate-400">
          {new Date(row.original.createdAt).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.status === "new" && (
            <button
              onClick={() => updateStatus(row.original.id, "read")}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-400"
              title="Đánh dấu đã đọc"
            >
              <CheckCircle size={14} />
            </button>
          )}
          <button
            onClick={() => deleteMessage(row.original.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400"
            title="Xoá"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tin nhắn liên hệ</h1>
          <p className="text-sm text-slate-400">Tin nhắn từ form liên hệ website</p>
        </div>
        <div className="flex gap-2">
          {["", "new", "read", "replied"].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); fetchData(1, s); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === s
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {s === "" ? "Tất cả" : statusMap[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        data={messages}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => fetchData(page, statusFilter)}
      />
    </div>
  );
}
