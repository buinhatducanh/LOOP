"use client";

interface LoadingSkeletonProps {
  type?: "card" | "row" | "table" | "detail";
  count?: number;
  className?: string;
}

export function LoadingSkeleton({
  type = "card",
  count = 5,
  className = "",
}: LoadingSkeletonProps) {
  if (type === "table") {
    return (
      <div className={`overflow-hidden rounded-xl border ${className}`}
        style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-3 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            {Array.from({ length: count }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 4 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-3 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (type === "detail") {
    return (
      <div className={`space-y-4 p-6 rounded-xl border ${className}`}
        style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-2 w-24 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="h-4 w-full rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
          </div>
        ))}
      </div>
    );
  }

  if (type === "row") {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl border animate-pulse"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="w-10 h-10 rounded-full animate-pulse shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="flex-1 space-y-2">
              <div className="h-3 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="h-2 w-3/4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: card
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border p-4 animate-pulse"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="h-4 rounded mb-2" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="h-3 rounded w-3/4" style={{ background: "rgba(255,255,255,0.05)" }} />
        </div>
      ))}
    </div>
  );
}
