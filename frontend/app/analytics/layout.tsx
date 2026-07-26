import Link from "next/link";

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0A0F1A] px-4 py-6 text-slate-100 sm:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:flex-row">
        <aside className="w-full rounded-2xl border border-slate-800 bg-[#101B30]/80 p-4 lg:w-64">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Internal tools
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white">Analytics</h2>
            </div>

            <nav className="space-y-2 text-sm">
              <Link
                href="/analytics"
                className="block rounded-lg bg-blue-500/10 px-3 py-2 font-medium text-blue-200"
              >
                Overview
              </Link>
              <Link
                href="/dashboard"
                className="block rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800/80 hover:text-white"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </aside>

        <main className="flex-1 rounded-2xl border border-slate-800 bg-[#101B30]/60 p-4 sm:p-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-white md:text-2xl">
              Analytics
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Player engagement overview for the Mind Block platform.
            </p>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}