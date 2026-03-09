"use client";

import { useEffect, useState, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/data-table";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface TeamMember {
  id: string;
  slug: string;
  name: string;
  role: string;
  shortBio: string;
  image: string;
  expertise: string[];
  isActive: boolean;
  sortOrder: number;
}

const columns: ColumnDef<TeamMember, unknown>[] = [
  {
    accessorKey: "name",
    header: "Tên",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-sm font-bold text-white">
          {row.original.name.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-white">{row.original.name}</p>
          <p className="text-xs text-slate-500">{row.original.role}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "expertise",
    header: "Chuyên môn",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.expertise.slice(0, 3).map((e, i) => (
          <span key={i} className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-400">
            {e}
          </span>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Trạng thái",
    cell: ({ row }) => (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.original.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
        {row.original.isActive ? "Hiển thị" : "Ẩn"}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: () => (
      <div className="flex items-center gap-1">
        <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-400"><Pencil size={14} /></button>
        <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400"><Trash2 size={14} /></button>
      </div>
    ),
  },
];

export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/team")
      .then((r) => r.json())
      .then((data) => setMembers(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Đội ngũ</h1>
          <p className="text-sm text-slate-400">Thông tin team members</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus size={16} /> Thêm thành viên
        </button>
      </div>
      <DataTable data={members} columns={columns} loading={loading} />
    </div>
  );
}
