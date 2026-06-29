export default function Loading() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex justify-between items-center mb-8">
        <div className="h-10 w-48 bg-gray-200 rounded-lg"></div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
      </div>
      
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 w-24 bg-gray-100 rounded"></div>
          ))}
        </div>
        
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-6 flex items-center gap-6 border-b border-gray-50 last:border-0">
            <div className="w-12 h-12 bg-gray-100 rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-gray-100 rounded"></div>
              <div className="h-3 w-1/4 bg-gray-50 rounded"></div>
            </div>
            <div className="w-24 h-6 bg-gray-50 rounded-full"></div>
            <div className="w-20 h-10 bg-gray-100 rounded-xl"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
