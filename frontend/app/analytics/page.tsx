// frontend/app/analytics/page.tsx
import DauMauChart from "@/components/analytics/DauMauChart";

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen w-full bg-[#0A0F1A] px-4 py-8 text-slate-100 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Analytics</h1>
          <p className="text-sm text-slate-400">
            Player engagement overview for the Mind Block platform.
          </p>
        </div>

        <DauMauChart />
      </div>
    </div>
  );
}