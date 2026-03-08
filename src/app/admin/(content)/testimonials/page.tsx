"use client";

import { useEffect, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/data-table";
import { Plus, Star, Pencil, Trash2 } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  rating: number;
  text: string;
  isActive: boolean;
}

const columns: ColumnDef<Testimonial, unknown>[] = [
  {
    accessorKey: "name",
    header: "Khách hàng",
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-white">{row.original.name}</p>
        <p className="text-xs text-slate-500">{row.original.role} - {row.original.company}</p>
      </div>
    ),
  },
  {
    accessorKey: "rating",
    header: "Đánh giá",
    cell: ({ row }) => (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={12} className={i < row.original.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-700"} />
        ))}
      </div>
    ),
  },
  {
    accessorKey: "text",
    header: "Nội dung",
    cell: ({ row }) => <p className="max-w-xs truncate text-sm text-slate-300">{row.original.text}</p>,
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

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/testimonials")
      .then((r) => r.json())
      .then((data) => setTestimonials(Array.isArray(data) ? data : data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Đánh giá khách hàng</h1>
          <p className="text-sm text-slate-400">Quản lý testimonials hiển thị trên website</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus size={16} /> Thêm đánh giá
        </button>
      </div>
      <DataTable data={testimonials} columns={columns} loading={loading} />
    </div>
  );
}
