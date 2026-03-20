"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/routing";

export default function BlogErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      console.error("[Blog Error]", error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4">
      <div className="text-center max-w-lg space-y-6">
        <div className="text-6xl">📝</div>
        <h1 className="text-3xl font-bold text-white">Blog Error</h1>
        <p className="text-slate-400">
          Could not load the blog. Please try refreshing the page.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium"
          >
            Try again
          </button>
          <Link href="/blog" className="px-6 py-3 rounded-full border border-slate-700 text-slate-300 font-medium">
            Back to Blog
          </Link>
        </div>
      </div>
    </div>
  );
}
