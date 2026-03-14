export default function PricingLoading() {
  return (
    <div className="min-h-screen bg-[#020617] pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-4">
          <div className="h-10 w-48 mx-auto rounded-lg animate-shimmer" />
          <div className="h-5 w-80 mx-auto rounded animate-shimmer" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 rounded-xl animate-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
