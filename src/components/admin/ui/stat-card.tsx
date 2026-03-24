"use client";

interface StatCardProps {
  value: string | number;
  label: string;
  color?: string;
  subLabel?: string;
  className?: string;
}

export function StatCard({ value, label, color = "#A78BFA", subLabel, className = "" }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 text-center ${className}`}
      style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}
    >
      <p className="text-2xl font-black" style={{ color }}>
        {value}
      </p>
      <p className="text-xs mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
        {label}
      </p>
      {subLabel && (
        <p className="text-[10px] mt-0.5" style={{ color: "rgba(209,213,219,0.3)" }}>
          {subLabel}
        </p>
      )}
    </div>
  );
}
