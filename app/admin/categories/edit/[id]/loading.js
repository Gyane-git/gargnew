export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="relative">
        {/* Outer Ring */}
        <div className="w-16 h-16 rounded-full border-4 border-blue-100"></div>
        {/* Spinning Ring */}
        <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
      <h2 className="mt-6 text-xl font-semibold text-gray-700 animate-pulse">
        Preparing Edit Form...
      </h2>
      <p className="mt-2 text-gray-400 text-sm">Fetching category details from server</p>
    </div>
  );
}
