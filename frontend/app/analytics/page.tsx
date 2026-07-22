// frontend/app/analytics/page.tsx
import DauMauChart from "@/components/analytics/DauMauChart";

export default function AnalyticsPage() {
  return (
    <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Full-width for now; future charts can sit alongside it in the grid */}
      <div className="min-w-0 lg:col-span-2">
        <DauMauChart />
      </div>
    </div>
  );
}