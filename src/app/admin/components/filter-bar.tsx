"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, SlidersHorizontal, Calendar } from "lucide-react";
import { cn } from "@/components/ui/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export type FilterType = "select" | "date-range" | "boolean" | "text" | "multi-select";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  key: string;
  label: string;
  type: FilterType;
  /** For select / multi-select */
  options?: FilterOption[];
  placeholder?: string;
  /** For date-range: field name suffix for the "from" date */
  dateFieldSuffix?: string;
}

export interface FilterBarProps {
  /** Filter definitions */
  filters: FilterDef[];
  /** Called whenever any filter changes. Receives all active filter values. */
  onChange: (values: Record<string, string | string[]>) => void;
  /** Extra controls to render on the right side of the bar */
  extraControls?: React.ReactNode;
  /** Show the "Clear all" button even when no filters are active */
  showClearAllEvenEmpty?: boolean;
  /** CSS class for the wrapper */
  className?: string;
  /** Compact mode (no background, smaller padding) */
  compact?: boolean;
}

// ─── Internal component helpers ─────────────────────────────────────────────

function BooleanFilter({
  filter,
  value,
  onChange,
}: {
  filter: FilterDef;
  value: string;
  onChange: (key: string, val: string) => void;
}) {
  const current = value || "all";
  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 p-0.5">
      {[
        { value: "all", label: "Tất cả" },
        { value: "true", label: filter.label },
        { value: "false", label: `Không ${filter.label}` },
      ].map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(filter.key, opt.value === "all" ? "" : opt.value)}
          className={cn(
            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
            current === opt.value
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:bg-slate-800 hover:text-white",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function DateRangeFilter({
  filter,
  value,
  onChange,
}: {
  filter: FilterDef;
  value: { from?: string; to?: string };
  onChange: (key: string, val: string) => void;
}) {
  const fromKey = `${filter.key}From`;
  const toKey = `${filter.key}To`;

  const hasValue = value?.from || value?.to;

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="date"
          value={value?.from ?? ""}
          onChange={(e) => onChange(fromKey, e.target.value)}
          className={cn(
            "h-8 rounded-lg border border-slate-700 bg-slate-900 pl-8 pr-2 text-xs text-white outline-none focus:border-blue-500 transition-colors",
            !value?.from && "text-slate-500",
          )}
        />
      </div>
      <span className="text-slate-600 text-xs">–</span>
      <div className="relative">
        <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="date"
          value={value?.to ?? ""}
          onChange={(e) => onChange(toKey, e.target.value)}
          className={cn(
            "h-8 rounded-lg border border-slate-700 bg-slate-900 pl-8 pr-2 text-xs text-white outline-none focus:border-blue-500 transition-colors",
            !value?.to && "text-slate-500",
          )}
        />
      </div>
      {hasValue && (
        <button
          onClick={() => { onChange(fromKey, ""); onChange(toKey, ""); }}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function SelectFilter({
  filter,
  value,
  onChange,
}: {
  filter: FilterDef;
  value: string;
  onChange: (key: string, val: string) => void;
}) {
  const hasValue = Boolean(value);
  return (
    <div className="flex items-center gap-1.5">
      <Select value={value} onValueChange={(v) => onChange(filter.key, v === "__all__" ? "" : v)}>
        <SelectTrigger className={cn(
          "h-8 text-xs border-slate-700 bg-slate-900 text-white outline-none focus:border-blue-500 data-[placeholder]:text-slate-500 w-auto min-w-[120px]",
          hasValue && "border-blue-500/60 bg-blue-500/10",
        )}>
          <SelectValue placeholder={filter.placeholder ?? filter.label} />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-800 text-white">
          <SelectItem value="__all__" className="text-slate-400 text-xs">
            {filter.placeholder ?? `Tất cả ${filter.label}`}
          </SelectItem>
          {filter.options?.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasValue && (
        <button
          onClick={() => onChange(filter.key, "")}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

// ─── Main FilterBar component ────────────────────────────────────────────────

export function FilterBar({
  filters,
  onChange,
  extraControls,
  showClearAllEvenEmpty = false,
  className,
  compact = false,
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialise filter state from URL params
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of filters) {
      if (f.type === "date-range") {
        const from = searchParams.get(`${f.key}From`) ?? "";
        const to = searchParams.get(`${f.key}To`) ?? "";
        if (from) initial[`${f.key}From`] = from;
        if (to) initial[`${f.key}To`] = to;
      } else {
        const v = searchParams.get(f.key) ?? "";
        if (v) initial[f.key] = v;
      }
    }
    return initial;
  });

  // Count active non-empty filters (excluding empty strings and "all")
  const activeCount = useMemo(() => {
    return Object.entries(values).filter(([, v]) => v && v !== "__all__" && v !== "all").length;
  }, [values]);

  // Sync URL when values change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Clear old filter params first
    for (const f of filters) {
      if (f.type === "date-range") {
        params.delete(`${f.key}From`);
        params.delete(`${f.key}To`);
      } else {
        params.delete(f.key);
      }
    }

    // Set new values
    for (const [k, v] of Object.entries(values)) {
      if (v && v !== "__all__" && v !== "all") {
        params.set(k, v);
      }
    }

    // Reset to page 1 on filter change
    params.delete("page");

    const qs = params.toString();
    router.replace(qs ? `?${qs}` : ".", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const handleChange = useCallback((key: string, val: string) => {
    setValues((prev) => {
      const next = { ...prev };
      if (!val || val === "all" || val === "__all__") {
        delete next[key];
      } else {
        next[key] = val;
      }
      return next;
    });
  }, []);

  // Propagate changes upward
  useEffect(() => {
    onChange(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const handleClearAll = () => {
    setValues({});
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50",
        compact ? "px-3 py-2" : "px-4 py-3",
        className,
      )}
    >
      {/* Filter controls */}
      {filters.map((filter) => {
        if (filter.type === "boolean") {
          return (
            <BooleanFilter
              key={filter.key}
              filter={filter}
              value={values[filter.key] ?? ""}
              onChange={handleChange}
            />
          );
        }
        if (filter.type === "date-range") {
          return (
            <DateRangeFilter
              key={filter.key}
              filter={filter}
              value={{
                from: values[`${filter.key}From`],
                to: values[`${filter.key}To`],
              }}
              onChange={handleChange}
            />
          );
        }
        return (
          <SelectFilter
            key={filter.key}
            filter={filter}
            value={values[filter.key] ?? ""}
            onChange={handleChange}
          />
        );
      })}

      {/* Extra controls */}
      {extraControls && <div className="flex items-center gap-2 ml-auto">{extraControls}</div>}

      {/* Active count badge + clear */}
      {(activeCount > 0 || showClearAllEvenEmpty) && (
        <div className="ml-auto flex items-center gap-2">
          {activeCount > 0 && (
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] h-5 px-1.5">
              <SlidersHorizontal size={10} />
              {activeCount} bộ lọc
            </Badge>
          )}
          {activeCount > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-white transition-colors"
            >
              <X size={12} />
              Xóa lọc
            </button>
          )}
        </div>
      )}
    </div>
  );
}
