// frontend/app/analytics/layout.tsx
export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0A0F1A] px-4 py-6 text-slate-100 sm:px-6 md:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-white md:text-2xl">
            Analytics
          </h1>
          <p className="text-sm text-slate-400">
            Player engagement overview for the Mind Block platform.
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}