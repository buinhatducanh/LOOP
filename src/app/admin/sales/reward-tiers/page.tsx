"use client";
import {
  AdminCrudList,
  type ColumnDef,
  type Action,
  type FormField,
  type FilterConfig,
} from "@/components/admin/admin-crud-list";

const TIER_COLORS: Record<number, string> = {
  1: "bg-slate-500/20 text-slate-400",
  2: "bg-amber-500/20 text-amber-400",
  3: "bg-orange-500/20 text-orange-400",
  4: "bg-purple-500/20 text-purple-400",
  5: "bg-red-500/20 text-red-400",
  6: "bg-blue-500/20 text-blue-400",
};

export default function AdminRewardTiersPage() {
  const columns: ColumnDef<any>[] = [
    {
      key: "level",
      header: "Cấp",
      cell: ({ value }) => (
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${TIER_COLORS[Number(value)] ?? "bg-slate-500/20 text-slate-400"}`}>
          Cấp {String(value ?? "")}
        </span>
      ),
    },
    { key: "name", header: "Tên cấp" },
    { key: "nameVi", header: "Tên (VI)" },
    { key: "description", header: "Mô tả" },
    {
      key: "minXp",
      header: "XP tối thiểu",
      cell: ({ value }) => <span className="font-medium text-purple-400">⬡{Number(value).toLocaleString()}</span>,
    },
    { key: "_count", header: "Quà tặng", cell: ({ value }) => <span className="text-slate-400">{String((value as any)?.items ?? 0)}</span> },
    {
      key: "isActive",
      header: "Trạng thái",
      cell: ({ value }) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${value ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {value ? "Đang bật" : "Đã tắt"}
        </span>
      ),
    },
  ];

  const actions: Action<any>[] = [{ type: "view" }, { type: "edit" }, { type: "delete" }];

  const formFields: FormField[] = [
    { key: "level", label: "Cấp (số)", type: "number" },
    { key: "name", label: "Tên cấp (EN)", type: "text" },
    { key: "nameVi", label: "Tên cấp (VI)", type: "text" },
    { key: "description", label: "Mô tả", type: "textarea" },
    { key: "minXp", label: "XP tối thiểu", type: "number" },
    { key: "isActive", label: "Kích hoạt", type: "boolean" },
  ];

  const filters: FilterConfig[] = [
    { key: "search", label: "Tìm kiếm", type: "search", placeholder: "Tìm theo tên..." },
    {
      key: "isActive",
      label: "Trạng thái",
      type: "select",
      options: [
        { value: "true", label: "Đang bật" },
        { value: "false", label: "Đã tắt" },
      ],
    },
  ];

  return (
    <AdminCrudList<any>
      apiPath="/api/admin/reward-tiers"
      entityName="Reward Tiers"
      columns={columns}
      actions={actions}
      formFields={formFields}
      filters={filters}
    />
  );
}
