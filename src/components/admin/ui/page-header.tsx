"use client";

import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  count?: number | string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, count, action, className = "" }: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {(description || count !== undefined) && (
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            {count !== undefined ? `${count} · ` : ""}
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
