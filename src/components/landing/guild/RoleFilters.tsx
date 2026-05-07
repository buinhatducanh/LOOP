"use client";

/**
 * RoleFilters — Department / role filter pills with holographic active state
 */
import { motion } from "motion/react";
import { DS } from "@/lib/design-tokens";
import { rgba } from "@/components/ui/utils";

export type RoleFilter =
  | "all"
  | "PM"
  | "PO"
  | "CEO"
  | "SC"
  | "HR"
  | "MKT"
  | "DESIGNER"
  | "DEV";

interface RoleFiltersProps {
  activeFilter: RoleFilter;
  onFilterChange: (filter: RoleFilter) => void;
  // i18n labels passed from parent
  labels: Record<RoleFilter, string>;
}

const FILTERS: Array<{ id: RoleFilter; icon: string; color: string }> = [
  { id: "all",      icon: "◎", color: "#3B82F6" },
  { id: "PM",       icon: "⊙", color: "#F59E0B" },
  { id: "PO",       icon: "◉", color: "#10B981" },
  { id: "CEO",      icon: "⬢", color: "#EF4444" },
  { id: "SC",       icon: "◈", color: "#8B5CF6" },
  { id: "HR",       icon: "◇", color: "#EC4899" },
  { id: "MKT",      icon: "◐", color: "#06B6D4" },
  { id: "DESIGNER", icon: "✦", color: "#F472B6" },
  { id: "DEV",      icon: "⌗", color: "#6366F1" },
];

export function RoleFilters({ activeFilter, onFilterChange, labels }: RoleFiltersProps) {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {FILTERS.map((filter) => {
        const active = activeFilter === filter.id;
        return (
          <motion.button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className="relative px-4 py-2 rounded-sm transition-all duration-300"
            style={{
              backgroundImage: active
                ? `linear-gradient(135deg, ${filter.color}22, ${filter.color}11)`
                : "none",
              backgroundColor: active ? "transparent" : rgba(DS.bgCosmic, 0.5),
              border: `1px solid ${active ? filter.color + "80" : DS.border}`,
              color: active ? filter.color : DS.text4,
            }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {active && (
              <motion.div
                className="absolute inset-0 rounded-sm pointer-events-none"
                style={{
                  backgroundImage: `linear-gradient(90deg, transparent, ${filter.color}33, transparent)`,
                  backgroundSize: "200% 100%",
                }}
                animate={{ backgroundPosition: ["0% 0%", "200% 0%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            )}

            <div className="relative flex items-center gap-2">
              <span style={{ fontSize: 12 }}>{filter.icon}</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  fontWeight: 600,
                }}
              >
                {labels[filter.id]}
              </span>
              {active && (
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: filter.color,
                    boxShadow: `0 0 8px ${filter.color}`,
                  }}
                />
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
