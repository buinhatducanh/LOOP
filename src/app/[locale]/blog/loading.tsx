export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Header skeleton */}
      <div className="max-w-7xl mx-auto px-4 pt-32 pb-12">
        <div className="h-10 w-64 mx-auto rounded animate-shimmer" />
        <div className="h-5 w-96 mx-auto mt-4 rounded animate-shimmer" />
      </div>
      {/* Blog grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-slate-800">
              <div className="h-48 bg-slate-800/50 animate-shimmer" />
              <div className="p-6 space-y-3">
                <div className="h-4 w-24 rounded animate-shimmer" />
                <div className="h-6 w-full rounded animate-shimmer" />
                <div className="h-4 w-3/4 rounded animate-shimmer" />
                <div className="h-4 w-1/2 rounded animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
