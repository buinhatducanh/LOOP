"use client";

interface EmptyStateProps {
  icon?: string;
  message?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = "📭",
  message = "Không có dữ liệu",
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`text-center py-20 rounded-xl border ${className}`}
      style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
    >
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-sm font-medium" style={{ color: "rgba(209,213,219,0.3)" }}>
        {message}
      </p>
      {description && (
        <p className="text-xs mt-1" style={{ color: "rgba(209,213,219,0.2)" }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
