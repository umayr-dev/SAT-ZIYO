/**
 * Route-level loading UI for /dashboard/**.
 *
 * PERF: gives Next.js a Suspense boundary so the shell streams immediately
 * instead of the browser staring at a blank document while server data
 * resolves. Matters more here than in most apps because every data call is
 * browser -> Vercel(Stockholm) -> VPS -> Postgres.
 */
export default function DashboardLoading() {
  return (
    <div className="w-full animate-pulse space-y-4 p-2" aria-busy="true">
      <div className="h-8 w-56 rounded-md bg-gray-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-32 rounded-xl bg-gray-200" />
        <div className="h-32 rounded-xl bg-gray-200" />
        <div className="h-32 rounded-xl bg-gray-200" />
      </div>
      <div className="h-64 rounded-xl bg-gray-200" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
