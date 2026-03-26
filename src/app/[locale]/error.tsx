/**
 * Global Error Page — LOOP Solutions
 * Catches unhandled errors in the [locale] segment.
 */

"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: Props) {
  useEffect(() => {
    // Log to error monitoring (Sentry, etc.)
    console.error("[locale] segment error:", error);
  }, [error]);

  return (
    <html lang="vi">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Đã xảy ra lỗi</h1>
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          Xin lỗi, đã có lỗi không mong muốn xảy ra.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre style={{ textAlign: "left", background: "#f5f5f5", padding: "1rem", overflow: "auto", fontSize: "0.875rem" }}>
            {error.message}
          </pre>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            padding: "0.5rem 1.5rem",
            background: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Thử lại
        </button>
      </body>
    </html>
  );
}
