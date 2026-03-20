export default function ContactLoading() {
  return (
    <div className="min-h-screen bg-[#020617]">
      <div className="max-w-4xl mx-auto px-4 pt-32 pb-20">
        {/* Header skeleton */}
        <div className="text-center mb-12 space-y-4">
          <div className="h-10 w-56 mx-auto rounded animate-shimmer" />
          <div className="h-5 w-96 mx-auto rounded animate-shimmer" />
        </div>
        {/* Form skeleton */}
        <div className="space-y-6 max-w-xl mx-auto">
          <div className="h-12 rounded-lg animate-shimmer" />
          <div className="h-12 rounded-lg animate-shimmer" />
          <div className="h-12 rounded-lg animate-shimmer" />
          <div className="h-40 rounded-lg animate-shimmer" />
          <div className="h-12 w-40 rounded-full animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
