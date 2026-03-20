"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to Sentry if available
    if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
      console.error("[App Error]", error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
      <div className="text-center max-w-lg space-y-6">
        {/* Gradient text */}
        <div className="text-8xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Oops!
        </div>

        <h1 className="text-2xl font-semibold text-white">
          Something went wrong
        </h1>

        <p className="text-slate-400 leading-relaxed">
          We encountered an unexpected error. Our team has been notified and is working to fix it.
        </p>

        {error?.digest && (
          <p className="text-xs text-slate-600 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex gap-4 justify-center pt-4">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-6 py-3 rounded-full border border-slate-700 text-slate-300 font-medium hover:border-slate-500 transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
