export default function TeamListLoading() {
  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Header skeleton */}
      <div className="max-w-7xl mx-auto px-4 pt-32 pb-12">
        <div className="h-10 w-48 mx-auto rounded animate-shimmer" />
        <div className="h-5 w-80 mx-auto mt-4 rounded animate-shimmer" />
      </div>
      {/* Team grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-slate-800">
              <div className="h-64 bg-slate-800/50 animate-shimmer" />
              <div className="p-4 space-y-2">
                <div className="h-5 w-3/4 rounded animate-shimmer" />
                <div className="h-4 w-1/2 rounded animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
