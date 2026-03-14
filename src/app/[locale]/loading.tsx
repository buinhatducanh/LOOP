export default function Loading() {
  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Hero skeleton */}
      <div className="relative h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-6 px-4">
          <div className="h-12 w-72 mx-auto rounded-lg animate-shimmer" />
          <div className="h-6 w-96 mx-auto rounded animate-shimmer" />
          <div className="h-6 w-80 mx-auto rounded animate-shimmer" />
          <div className="flex gap-4 justify-center mt-8">
            <div className="h-12 w-40 rounded-full animate-shimmer" />
            <div className="h-12 w-40 rounded-full animate-shimmer" />
          </div>
        </div>
      </div>
      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-8">
        <div className="h-8 w-64 mx-auto rounded animate-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-xl animate-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
