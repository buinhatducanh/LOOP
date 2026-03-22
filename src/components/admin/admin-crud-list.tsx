"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageUploader } from "@/components/ui/image-uploader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ─── Shared Status Badge ────────────────────────────────────────────────────────

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active:     { bg: "bg-green-500/15", text: "text-green-400", dot: "bg-green-400" },
  true:       { bg: "bg-green-500/15", text: "text-green-400", dot: "bg-green-400" },
  isActive:   { bg: "bg-green-500/15", text: "text-green-400", dot: "bg-green-400" },
  published:   { bg: "bg-green-500/15", text: "text-green-400", dot: "bg-green-400" },
  completed:   { bg: "bg-green-500/15", text: "text-green-400", dot: "bg-green-400" },
  paid:        { bg: "bg-green-500/15", text: "text-green-400", dot: "bg-green-400" },
  confirmed:   { bg: "bg-blue-500/15",  text: "text-blue-400",  dot: "bg-blue-400"  },
  in_progress: { bg: "bg-blue-500/15",  text: "text-blue-400",  dot: "bg-blue-400"  },
  processing:  { bg: "bg-blue-500/15",  text: "text-blue-400",  dot: "bg-blue-400"  },
  new:         { bg: "bg-blue-500/15",  text: "text-blue-400",  dot: "bg-blue-400"  },
  pending:     { bg: "bg-yellow-500/15", text: "text-yellow-400", dot: "bg-yellow-400" },
  partial:     { bg: "bg-yellow-500/15", text: "text-yellow-400", dot: "bg-yellow-400" },
  read:        { bg: "bg-slate-500/15",  text: "text-slate-400",  dot: "bg-slate-400"  },
  replied:     { bg: "bg-slate-500/15",  text: "text-slate-400",  dot: "bg-slate-400"  },
  inactive:    { bg: "bg-slate-500/15",  text: "text-slate-400",  dot: "bg-slate-400"  },
  false:       { bg: "bg-slate-500/15",  text: "text-slate-400",  dot: "bg-slate-400"  },
  cancelled:   { bg: "bg-red-500/15",    text: "text-red-400",    dot: "bg-red-400"    },
  refunded:    { bg: "bg-red-500/15",    text: "text-red-400",    dot: "bg-red-400"    },
  failed:     { bg: "bg-red-500/15",    text: "text-red-400",    dot: "bg-red-400"    },
  expired:    { bg: "bg-red-500/15",    text: "text-red-400",    dot: "bg-red-400"    },
  archived:   { bg: "bg-orange-500/15", text: "text-orange-400", dot: "bg-orange-400" },
  draft:      { bg: "bg-orange-500/15", text: "text-orange-400", dot: "bg-orange-400" },
  suspended:   { bg: "bg-orange-500/15", text: "text-orange-400", dot: "bg-orange-400" },
  one_time:    { bg: "bg-purple-500/15", text: "text-purple-400", dot: "bg-purple-400" },
  recurring:   { bg: "bg-purple-500/15", text: "text-purple-400", dot: "bg-purple-400" },
  highlighted: { bg: "bg-cyan-500/15",   text: "text-cyan-400",   dot: "bg-cyan-400"   },
  default:     { bg: "bg-slate-500/15",  text: "text-slate-400",  dot: "bg-slate-400"  },
};

export const STATUS_LABELS: Record<string, string> = {
  active: "Hoạt động",
  inactive: "Không hoạt động",
  published: "Đã xuất bản",
  draft: "Nháp",
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  in_progress: "Đang thực hiện",
  processing: "Đang xử lý",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  refunded: "Hoàn tiền",
  paid: "Đã thanh toán",
  partial: "TT một phần",
  unpaid: "Chưa thanh toán",
  new: "Mới",
  read: "Đã đọc",
  replied: "Đã trả lời",
  archived: "Lưu trữ",
  failed: "Thất bại",
  expired: "Hết hạn",
  suspended: "Tạm ngưng",
  one_time: "Một lần",
  recurring: "Định kỳ",
  highlighted: "Nổi bật",
  default: "Mặc định",
  true: "Có",
  false: "Không",
};

export function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.default;
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {label}
    </span>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────────

export function AdminPagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
}: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const items = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => {
      if (totalPages <= 7) return true;
      if (p === 1 || p === totalPages) return true;
      return Math.abs(p - page) <= 1;
    })
    .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("ellipsis");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-slate-500">
        Hiển thị {(page - 1) * limit + 1}–{Math.min(page * limit, total)} / {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
        >
          <ChevronLeft size={15} />
        </button>
        {items.map((item, i) =>
          item === "ellipsis" ? (
            <span key={`e-${i}`} className="px-1 text-slate-500">…</span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item)}
              className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors ${
                item === page
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Filter Bar ────────────────────────────────────────────────────────────────

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: "search" | "select" | "multi" | "boolean";
  options?: FilterOption[];
  placeholder?: string;
}

export function AdminFilterBar({
  filters,
  search,
  onSearchChange,
  onFilterChange,
}: {
  filters: FilterConfig[];
  search: string;
  onSearchChange: (q: string) => void;
  onFilterChange: (key: string, value: string | string[] | boolean) => void;
}) {
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[] | boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const searchFilter = filters.find((f) => f.type === "search");
  const otherFilters = filters.filter((f) => f.type !== "search");
  const visibleFilters = showAll ? otherFilters : otherFilters.slice(0, 3);
  const hasMoreFilters = otherFilters.length > 3;
  const activeCount = Object.values(activeFilters).filter(
    (v) => (Array.isArray(v) ? v.length > 0 : v !== "" && v !== undefined && v !== "all")
  ).length;

  const handleChange = (key: string, value: string | string[] | boolean) => {
    const next = { ...activeFilters };
    if (Array.isArray(value) ? value.length === 0 : value === "" || value === "all") {
      delete next[key];
    } else {
      next[key] = value;
    }
    setActiveFilters(next);
    onFilterChange(key, value);
  };

  const clearAll = () => {
    setActiveFilters({});
    filters.forEach((f) => {
      if (f.type !== "search") onFilterChange(f.key, "" as string);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {searchFilter && (
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchFilter.placeholder ?? searchFilter.label}
              className="h-9 pl-9"
            />
          </div>
        )}
        {visibleFilters.map((f) => (
          <select
            key={f.key}
            value={String(activeFilters[f.key] ?? "all")}
            onChange={(e) => handleChange(f.key, e.target.value)}
            className="h-9 rounded-lg border border-slate-700 bg-slate-800 px-3 text-xs text-slate-300 outline-none focus:border-blue-500"
          >
            <option value="all">{f.label} — Tất cả</option>
            {f.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
        {hasMoreFilters && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="h-9 rounded-lg border border-slate-700 px-3 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-300"
          >
            {showAll ? "Ẩn bộ lọc" : `+${otherFilters.length - 3} bộ lọc`}
          </button>
        )}
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="h-9 rounded-lg border border-red-500/30 px-3 text-xs text-red-400 hover:bg-red-500/10"
          >
            Xóa lọc ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Column Definition ────────────────────────────────────────────────────────

export type Action<T> =
  | { type: "view"; href?: string; title?: string }
  | { type: "edit"; title?: string }
  | { type: "delete"; title?: string; message?: string }
  | { type: "toggle"; key: string; value: boolean }
  | { type: "custom"; label: string; icon: LucideIcon; onClick: (row: T) => void };

export interface ColumnDef<T> {
  /** Data key for auto-rendering (simple columns) */
  key: string;
  /** Custom render function (overrides key when provided) */
  accessor?: (row: T) => React.ReactNode;
  header: string;
  /** Custom cell render (receives the full row and computed value) */
  cell?: (context: { row: T; value: unknown }) => React.ReactNode;
  width?: string;
  className?: string;
}

export interface AdminCrudProps<T extends { id: string }> {
  // ── API ──────────────────────────────────────────────────
  apiPath: string;               // base API path, e.g. "/api/admin/users"
  entityName: string;            // "Người dùng", "Dịch vụ", ...

  // ── List ───────────────────────────────────────────────
  columns: ColumnDef<T>[];
  actions?: Action<T>[];

  // ── Filter config ──────────────────────────────────────
  filters?: FilterConfig[];

  // ── Status key (auto-render StatusBadge) ─────────────
  statusKey?: string;

  // ── Detail view (sheet) ───────────────────────────────
  detailFields?: Array<{
    key: string;
    label: string;
    render?: (value: unknown) => React.ReactNode;
  }>;

  // ── Create / Edit form fields ──────────────────────────
  formFields?: FormField[];

  // ── Default create values ─────────────────────────────
  defaultValues?: Partial<T>;
}

export type FormField =
  | { type: "text"; key: string; label: string; required?: boolean; placeholder?: string }
  | { type: "email"; key: string; label: string; required?: boolean; placeholder?: string }
  | { type: "password"; key: string; label: string; required?: boolean; placeholder?: string }
  | { type: "number"; key: string; label: string; required?: boolean; placeholder?: string; min?: number }
  | { type: "textarea"; key: string; label: string; required?: boolean; placeholder?: string; rows?: number }
  | { type: "select"; key: string; label: string; required?: boolean; placeholder?: string; options: Array<{ value: string; label: string }> }
  | { type: "boolean"; key: string; label: string }
  | { type: "image"; key: string; label: string; folder?: string }
  | { type: "slug"; key: string; label: string; sourceKey?: string }
  | { type: "custom"; key: string; label: string; render: (field: FormField, value: unknown, onChange: (v: unknown) => void) => React.ReactNode };

// ─── Auto-slug helper ──────────────────────────────────────────────────────

export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── AdminCrudList ─────────────────────────────────────────────────────────

export function AdminCrudList<T extends { id: string }>({
  apiPath,
  entityName,
  columns,
  actions = [{ type: "edit" }, { type: "delete", title: "Xác nhận xóa" }],
  filters = [],
  statusKey,
  detailFields,
  formFields = [],
  defaultValues = {},
}: AdminCrudProps<T>) {
  // ── List state ──────────────────────────────────────
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filterParams, setFilterParams] = useState<Record<string, string>>({});
  const limit = 20;
  const searchDelayRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Modal state ─────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Form state ──────────────────────────────────────
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  // ── Fetch list ──────────────────────────────────────
  const fetchList = useCallback(
    async (p = 1, q = search, fp: Record<string, string> = filterParams) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(limit),
          ...(q ? { search: q } : {}),
          ...fp,
        });
        const res = await fetch(`${apiPath}?${params}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setItems(data.data ?? []);
        setPage(data.page ?? 1);
        setTotalPages(data.totalPages ?? 1);
        setTotal(data.total ?? 0);
      } catch {
        toast.error(`Không thể tải danh sách ${entityName}`);
      } finally {
        setLoading(false);
      }
    },
    [apiPath, entityName, search, filterParams]
  );

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Debounced search
  const handleSearch = (q: string) => {
    setSearch(q);
    clearTimeout(searchDelayRef.current);
    searchDelayRef.current = setTimeout(() => {
      setFilterParams({});
      fetchList(1, q, {});
    }, 350);
  };

  const handleFilterChange = (key: string, value: unknown) => {
    const next = { ...filterParams };
    if (value === "all" || value === "") delete next[key];
    else next[key] = String(value);
    setFilterParams(next);
    fetchList(1, search, next);
  };

  const handlePageChange = (p: number) => fetchList(p, search, filterParams);

  // ── Open create / edit ──────────────────────────────
  const openCreate = () => {
    setFormData({ ...defaultValues });
    setEditingId("__create__");
  };

  const openEdit = async (id: string) => {
    setDetailLoading(true);
    setEditingId(id);
    try {
      const res = await fetch(`${apiPath}/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData(data);
      }
    } catch { /* silent */ }
    setDetailLoading(false);
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailId(id);
    try {
      const res = await fetch(`${apiPath}/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDetailData(data);
      }
    } catch { /* silent */ }
    setDetailLoading(false);
  };

  const closeSheet = () => {
    setEditingId(null);
    setDetailId(null);
    setFormData({});
  };

  // ── Save (create / update) ─────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const isCreate = editingId === "__create__";
      const url = isCreate ? apiPath : `${apiPath}/${editingId}`;
      const method = isCreate ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Lỗi server");
      }
      toast.success(isCreate ? `Đã tạo ${entityName}` : `Đã cập nhật ${entityName}`);
      closeSheet();
      fetchList(page, search, filterParams);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : `Lỗi khi lưu ${entityName}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      const res = await fetch(`${apiPath}/${deletingId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Lỗi server");
      toast.success(`Đã xóa ${entityName}`);
      setDeletingId(null);
      fetchList(page, search, filterParams);
    } catch {
      toast.error(`Lỗi khi xóa ${entityName}`);
    } finally {
      setDeleting(false);
    }
  };

  // ── Toggle ────────────────────────────────────────
  const handleToggle = async (row: T, key: string, value: boolean) => {
    const res = await fetch(`${apiPath}/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    if (res.ok) {
      toast.success("Đã cập nhật");
      fetchList(page, search, filterParams);
    } else {
      toast.error("Lỗi khi cập nhật trạng thái");
    }
  };

  // ── Render form field ───────────────────────────────
  const renderField = (field: FormField) => {
    const value = formData[field.key] ?? "";

    switch (field.type) {
      case "text":
      case "email":
      case "password":
      case "number":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label>
              {field.label}
              {field.required && <span className="ml-1 text-red-400">*</span>}
            </Label>
            <Input
              type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
              value={String(value ?? "")}
              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              placeholder={field.placeholder}
              required={field.required}
              min={field.type === "number" ? (field.min ?? 0) : undefined}
            />
          </div>
        );

      case "textarea":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label>
              {field.label}
              {field.required && <span className="ml-1 text-red-400">*</span>}
            </Label>
            <textarea
              value={String(value ?? "")}
              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              placeholder={field.placeholder}
              rows={field.rows ?? 4}
              className="flex min-h-[80px] w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500"
            />
          </div>
        );

      case "select":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label>
              {field.label}
              {field.required && <span className="ml-1 text-red-400">*</span>}
            </Label>
            <select
              value={String(value ?? "")}
              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              className="h-9 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm text-white outline-none focus:border-blue-500"
            >
              <option value="">{field.placeholder ?? "— Chọn —"}</option>
              {field.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        );

      case "boolean":
        return (
          <div key={field.key} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-3">
            <Label className="cursor-pointer">{field.label}</Label>
            <Switch
              checked={Boolean(value)}
              onCheckedChange={(v) => setFormData({ ...formData, [field.key]: v })}
            />
          </div>
        );

      case "image":
        return (
          <div key={field.key} className="space-y-1.5">
            <Label>{field.label}</Label>
            <ImageUploader
              value={String(value ?? "")}
              onChange={(url) => setFormData({ ...formData, [field.key]: url })}
              folder={field.folder}
            />
          </div>
        );

      case "slug": {
        const source = field.sourceKey ? String(formData[field.sourceKey] ?? "") : String(value ?? "");
        return (
          <div key={field.key} className="space-y-1.5">
            <Label>{field.label}</Label>
            <Input
              value={String(value ?? toSlug(source))}
              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value || toSlug(source) })}
              placeholder="auto-generated-from-title"
            />
          </div>
        );
      }

      case "custom": {
        const onChange = (v: unknown) =>
          setFormData({ ...formData, [field.key]: v });
        return (
          <div key={field.key} className="space-y-1.5">
            <Label>{field.label}</Label>
            {field.render(field, value, onChange)}
          </div>
        );
      }

      default:
        return null;
    }
  }

  // ── Render ────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{entityName}</h1>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus size={14} />
          Thêm mới
        </Button>
      </div>

      {/* Filters */}
      {filters.length > 0 && (
        <AdminFilterBar
          filters={filters}
          search={search}
          onSearchChange={handleSearch}
          onFilterChange={handleFilterChange}
        />
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium text-slate-400"
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">Thao tác</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-slate-800">
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <Skeleton className="h-4 w-full rounded" />
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-4 py-3"><Skeleton className="ml-auto h-8 w-20 rounded" /></td>
                  )}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="py-12 text-center text-slate-500">
                  Chưa có dữ liệu
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="border-slate-800 transition-colors hover:bg-slate-800/30">
                  {columns.map((col) => {
                    // Resolve value: accessor function > key > undefined
                    const value = col.accessor
                      ? col.accessor(row)
                      : (row as Record<string, unknown>)[col.key];
                    const isReactNode = value !== null && typeof value === "object" && "$$typeof" in (value as object);

                    // Use custom cell renderer if provided
                    if (col.cell) {
                      return (
                        <td key={col.key} className={`px-4 py-3 text-slate-300 ${col.className ?? ""}`}>
                          {col.cell({ row, value })}
                        </td>
                      );
                    }

                    return (
                      <td key={col.key} className={`px-4 py-3 text-slate-300 ${col.className ?? ""}`}>
                        {isReactNode
                          ? (value as React.ReactNode)
                          : value == null
                          ? <span className="text-slate-600">—</span>
                          : col.key === statusKey
                          ? <StatusBadge status={String(value)} />
                          : typeof value === "boolean"
                          ? value
                            ? <CheckCircle2 size={16} className="text-green-400" />
                            : <XCircle size={16} className="text-slate-500" />
                          : String(value)}
                      </td>
                    );
                  })}
                  {actions.length > 0 && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {actions.map((action, i) => {
                          if (action.type === "view") {
                            return (
                              <button
                                key={i}
                                onClick={() => openDetail(row.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white"
                                title="Xem chi tiết"
                              >
                                <Eye size={14} />
                              </button>
                            );
                          }
                          if (action.type === "edit") {
                            return (
                              <button
                                key={i}
                                onClick={() => openEdit(row.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white"
                                title="Sửa"
                              >
                                <Pencil size={14} />
                              </button>
                            );
                          }
                          if (action.type === "delete") {
                            return (
                              <button
                                key={i}
                                onClick={() => setDeletingId(row.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-500/20 hover:text-red-400"
                                title="Xóa"
                              >
                                <Trash2 size={14} />
                              </button>
                            );
                          }
                          if (action.type === "toggle") {
                            return (
                              <button
                                key={i}
                                onClick={() => handleToggle(row, action.key, !action.value)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg"
                                title={action.value ? "Tắt" : "Bật"}
                              >
                                {action.value ? (
                                  <CheckCircle2 size={16} className="text-green-400" />
                                ) : (
                                  <XCircle size={16} className="text-slate-500" />
                                )}
                              </button>
                            );
                          }
                          if (action.type === "custom") {
                            const Icon = action.icon;
                            return (
                              <button
                                key={i}
                                onClick={() => action.onClick(row)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white"
                                title={action.label}
                              >
                                <Icon size={14} />
                              </button>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <AdminPagination
        page={page}
        limit={limit}
        total={total}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Create / Edit Sheet */}
      <Sheet open={!!editingId} onOpenChange={(o) => !o && closeSheet()}>
        <SheetContent className="flex flex-col bg-slate-900 border-slate-800 w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">
              {editingId === "__create__" ? `Thêm mới ${entityName}` : `Sửa ${entityName}`}
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              {editingId === "__create__"
                ? `Điền thông tin để tạo mới.`
                : "Chỉnh sửa thông tin."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 overflow-y-auto py-4">
            {detailLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              formFields.map(renderField)
            )}
          </div>
          <SheetFooter className="border-t border-slate-800 pt-4">
            <Button variant="outline" onClick={closeSheet} className="border-slate-700 text-slate-300">
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editingId === "__create__" ? "Tạo mới" : "Lưu thay đổi"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Detail Sheet */}
      <Sheet open={!!detailId} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="bg-slate-900 border-slate-800 w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">Chi tiết {entityName}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 overflow-y-auto py-4">
            {detailLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-5 w-full rounded" />
                ))}
              </div>
            ) : detailData ? (
              detailFields && detailFields.length > 0 ? (
                detailFields.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{f.label}</p>
                    <p className="text-sm text-slate-200">
                      {f.render
                        ? f.render(detailData[f.key])
                        : String(detailData[f.key] ?? "—")}
                    </p>
                    {f.key === statusKey && (
                      <StatusBadge status={String(detailData[f.key] ?? "")} />
                    )}
                  </div>
                ))
              ) : (
                Object.entries(detailData).map(([key, val]) => (
                  <div key={key} className="space-y-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{key}</p>
                    <p className="text-sm text-slate-200">
                      {typeof val === "boolean" ? (
                        val ? (
                          <CheckCircle2 size={16} className="text-green-400" />
                        ) : (
                          <XCircle size={16} className="text-slate-500" />
                        )
                      ) : Array.isArray(val) ? (
                        val.length > 0 ? val.join(", ") : "—"
                      ) : typeof val === "object" && val !== null ? (
                        JSON.stringify(val)
                      ) : (
                        String(val ?? "—")
                      )}
                    </p>
                  </div>
                ))
              )
            ) : (
              <p className="text-sm text-slate-500">Không có dữ liệu</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirm */}
      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="text-red-400" size={18} />
              Xác nhận xóa
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Hành động này không thể hoàn tác. {entityName} sẽ bị xóa vĩnh viễn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeletingId(null)}
              className="border-slate-700 text-slate-300"
            >
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 size={14} className="animate-spin" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
