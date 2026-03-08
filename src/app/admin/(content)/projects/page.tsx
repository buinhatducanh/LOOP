"use client";

import { useEffect, useState, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/data-table";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

interface Project {
  id: string;
  slug: string;
  title: string;
  category: string;
  client: string;
  year: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  service: { title: string } | null;
}

const columns: ColumnDef<Project, unknown>[] = [
  {
    accessorKey: "title",
    header: "Dự án",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-white">{row.original.title}</p>
        <p className="text-xs text-slate-500">{row.original.client} - {row.original.year}</p>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Danh mục",
    cell: ({ row }) => (
      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
        {row.original.category}
      </span>
    ),
  },
  {
    id: "service",
    header: "Dịch vụ",
    cell: ({ row }) => (
      <span className="text-slate-300">{row.original.service?.title || "—"}</span>
    ),
  },
  {
    accessorKey: "isPublished",
    header: "Trạng thái",
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          row.original.isPublished
            ? "bg-green-500/20 text-green-400"
            : "bg-red-500/20 text-red-400"
        }`}
      >
        {row.original.isPublished ? <><Eye size={12} /> Published</> : <><EyeOff size={12} /> Draft</>}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: () => (
      <div className="flex items-center gap-1">
        <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-400">
          <Pencil size={14} />
        </button>
        <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400">
          <Trash2 size={14} />
        </button>
      </div>
    ),
  },
];

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async (page = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/admin/projects?${params}`);
      const data = await res.json();
      setProjects(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Dự án</h1>
          <p className="text-sm text-slate-400">Portfolio và case studies</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus size={16} />
          Thêm dự án
        </button>
      </div>

      <DataTable
        data={projects}
        columns={columns}
        loading={loading}
        searchPlaceholder="Tìm dự án..."
        pagination={pagination}
        onSearch={(s) => { setSearch(s); fetchData(1, s); }}
        onPageChange={(page) => fetchData(page, search)}
      />
    </div>
  );
}
