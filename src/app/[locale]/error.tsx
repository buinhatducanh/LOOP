/**
 * Global Error Page — LOOP Solutions
 * Catches unhandled errors in the [locale] segment.
 */

"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: Props) {
  const locale = useLocale() ?? "vi";

  useEffect(() => {
    // Log to error monitoring (Sentry, etc.)
    console.error("[locale] segment error:", error);
  }, [error]);

  return (
    <div style={{ 
      fontFamily: "system-ui, sans-serif", 
      padding: "4rem 2rem", 
      textAlign: "center",
      minHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem", color: "white" }}>Đã xảy ra lỗi</h1>
      <p style={{ color: "#94a3b8", marginBottom: "1.5rem", maxWidth: "400px" }}>
        Xin lỗi, đã có lỗi không mong muốn xảy ra.
      </p>
      
      {process.env.NODE_ENV === "development" && (
        <div style={{ maxWidth: "100%", width: "600px", margin: "0 auto" }}>
          <pre style={{ 
            textAlign: "left", 
            background: "rgba(255,255,255,0.05)", 
            color: "#f87171",
            padding: "1rem", 
            overflow: "auto", 
            fontSize: "0.875rem",
            borderRadius: "8px",
            border: "1px solid rgba(248,113,113,0.2)"
          }}>
            {error.message || "Unknown error"}
            {error.stack && (
              <div style={{ marginTop: "10px", fontSize: "0.75rem", opacity: 0.7, color: "#94a3b8" }}>
                {error.stack}
              </div>
            )}
          </pre>
        </div>
      )}
      
      <button
        onClick={reset}
        style={{
          marginTop: "2rem",
          padding: "0.75rem 2rem",
          background: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "12px",
          cursor: "pointer",
          fontWeight: "bold",
          transition: "all 0.2s"
        }}
        onMouseOver={(e) => e.currentTarget.style.background = "#2563eb"}
        onMouseOut={(e) => e.currentTarget.style.background = "#3b82f6"}
      >
        Thử lại
      </button>
    </div>
  );
}
