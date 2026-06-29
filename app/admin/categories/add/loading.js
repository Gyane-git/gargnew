export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-blue-100"></div>
        <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
      </div>
      <h2 className="mt-6 text-xl font-semibold text-gray-700 animate-pulse">
        Initializing...
      </h2>
    </div>
  );
}
