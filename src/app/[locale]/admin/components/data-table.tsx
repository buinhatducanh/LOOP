"use client";

import { useEffect, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/components/ui/utils";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  /** Placeholder for the global search input */
  searchPlaceholder?: string;
  /** Show global search input */
  showSearch?: boolean;
  /** Extra controls rendered between search bar and table */
  toolbar?: React.ReactNode;
  /** Optional filter row rendered between header and body */
  filterRow?: React.ReactNode;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
  };
  onPageChange?: (page: number) => void;
  /**
   * Called with the current global search string.
   * Debounced internally (400 ms) to avoid excessive API calls.
   */
  onSearch?: (search: string) => void;
  /** Initial search value (e.g. restored from URL) */
  initialSearch?: string;
  loading?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Tìm kiếm...",
  showSearch = true,
  toolbar,
  filterRow,
  pagination,
  onPageChange,
  onSearch,
  initialSearch = "",
  loading,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState(initialSearch);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevSearchRef = useRef(initialSearch);

  // Sync internal state when initialSearch changes (e.g. URL param change)
  useEffect(() => {
    if (initialSearch !== prevSearchRef.current) {
      setGlobalFilter(initialSearch);
      prevSearchRef.current = initialSearch;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSearch]);

  // Debounced onSearch
  const handleSearchChange = (value: string) => {
    setGlobalFilter(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch?.(value);
    }, 400);
  };

  // Clear search
  const handleClearSearch = () => {
    setGlobalFilter("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearch?.("");
  };

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, columnFilters },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* ── Search + Toolbar row ─────────────────────────────────────── */}
      {(showSearch || toolbar) && (
        <div className="flex flex-wrap items-center gap-3">
          {showSearch && (
            <div className="relative min-w-[240px] flex-1 max-w-sm">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-8 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 transition-colors"
              />
              {globalFilter && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  title="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
          {toolbar && <div className="flex flex-wrap items-center gap-2 flex-1">{toolbar}</div>}
        </div>
      )}

      {/* ── Filter row (optional column-level filters) ───────────────── */}
      {filterRow && <div className="px-1">{filterRow}</div>}

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-slate-800 bg-slate-900/80">
                  {hg.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sortDir = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400",
                          canSort && "cursor-pointer select-none hover:text-white transition-colors",
                        )}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      >
                        <span className="flex items-center gap-1.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <span className="text-slate-600">
                              {sortDir === "asc" ? (
                                <ArrowUp size={13} className="text-blue-400" />
                              ) : sortDir === "desc" ? (
                                <ArrowDown size={13} className="text-blue-400" />
                              ) : (
                                <ArrowUpDown size={13} className="opacity-50 group-hover:opacity-100" />
                              )}
                            </span>
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-24 animate-pulse rounded bg-slate-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-slate-800/30"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-slate-300">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ───────────────────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Hiển thị {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
              className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-slate-300">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange?.(pagination.page + 1)}
              className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
