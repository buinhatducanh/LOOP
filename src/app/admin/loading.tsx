export default function AdminLoading() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white border-r p-4 space-y-4">
        <div className="h-8 w-24 rounded animate-pulse bg-gray-200" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-10 rounded animate-pulse bg-gray-100" />
        ))}
      </div>
      <div className="flex-1 p-8 space-y-6">
        <div className="h-8 w-48 rounded animate-pulse bg-gray-200" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl animate-pulse bg-gray-200" />
          ))}
        </div>
        <div className="h-64 rounded-xl animate-pulse bg-gray-200" />
      </div>
    </div>
  );
}
