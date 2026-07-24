// frontend/components/analytics/CategoryPopularityChart.tsx
"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { CalendarRange, SlidersHorizontal, X } from "lucide-react";
import {
  getCategoryPopularity,
  type CategoryPopularityDataPoint,
} from "../../lib/api/analyticsApi";

type Metric = "uniqueUsers" | "puzzlesSolved";

const METRICS: { label: string; value: Metric }[] = [
  { label: "Unique Users", value: "uniqueUsers" },
  { label: "Puzzles Solved", value: "puzzlesSolved" },
];

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getDefaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29); // last 30 days
  return { startDate: formatDate(start), endDate: formatDate(end) };
}

const PRESETS = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
];

export default function CategoryPopularityChart() {
  const defaultRange = useMemo(getDefaultRange, []);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [metric, setMetric] = useState<Metric>("uniqueUsers");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["category-popularity", startDate, endDate],
    queryFn: () => getCategoryPopularity({ startDate, endDate }),
  });

  function applyPreset(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  }

  const chartData: CategoryPopularityDataPoint[] = useMemo(() => {
    const rows = data?.data ?? [];
    return [...rows].sort((a, b) => b[metric] - a[metric]);
  }, [data, metric]);

  const hasData = chartData.length > 0;
  const metricLabel = METRICS.find((m) => m.value === metric)?.label ?? "";

  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((preset) => (
        <button
          key={preset.label}
          type="button"
          onClick={() => applyPreset(preset.days)}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:border-blue-500/60 hover:text-white"
        >
          {preset.label}
        </button>
      ))}

      <div className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5">
        <CalendarRange className="h-4 w-4 text-slate-400" />
        <input
          type="date"
          value={startDate}
          max={endDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-transparent text-xs text-slate-200 outline-none [color-scheme:dark]"
          aria-label="Start date"
        />
        <span className="text-slate-500">–</span>
        <input
          type="date"
          value={endDate}
          min={startDate}
          max={formatDate(new Date())}
          onChange={(e) => setEndDate(e.target.value)}
          className="bg-transparent text-xs text-slate-200 outline-none [color-scheme:dark]"
          aria-label="End date"
        />
      </div>
    </div>
  );

  return (
    <div className="min-w-0 rounded-2xl border border-slate-800 bg-[#101B30] p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Category Popularity
          </h2>
          <p className="text-xs text-slate-400">
            Categories ranked by {metricLabel.toLowerCase()}
          </p>
        </div>

        {/* Desktop / wide tablet: controls shown inline */}
        <div className="hidden md:block">{controls}</div>

        {/* Narrow tablet & mobile: controls collapse behind this toggle */}
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-blue-500/60 hover:text-white md:hidden"
        >
          {filtersOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <SlidersHorizontal className="h-4 w-4" />
          )}
          Filters
        </button>
      </div>

      {/* Collapsible controls panel, only rendered below md */}
      {filtersOpen && (
        <div className="mt-3 rounded-xl border border-slate-700 bg-[#0A0F1A]/60 p-3 md:hidden">
          {controls}
        </div>
      )}

      <div
        role="tablist"
        aria-label="Ranking metric"
        className="mt-4 inline-flex w-fit rounded-lg border border-slate-700 p-1"
      >
        {METRICS.map((option) => {
          const isActive = option.value === metric;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setMetric(option.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                isActive
                  ? "bg-blue-500/20 text-blue-200"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div
        className="mt-6 w-full"
        style={{ height: Math.max(256, chartData.length * 40) }}
      >
        {isLoading && (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Loading category data...
          </div>
        )}

        {!isLoading && isError && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-red-400">
            <span>
              Couldn&apos;t load category popularity data
              {error instanceof Error ? `: ${error.message}` : "."}
            </span>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-lg border border-red-400/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-400/10"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !isError && !hasData && (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No category data for this date range yet.
          </div>
        )}

        {!isLoading && !isError && hasData && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
              barCategoryGap={12}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
                horizontal={false}
              />
              <XAxis
                type="number"
                stroke="#64748b"
                tick={{ fontSize: 12 }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="categoryName"
                stroke="#64748b"
                tick={{ fontSize: 12 }}
                width={120}
              />
              <Tooltip
                cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                contentStyle={{
                  background: "#0A0F1A",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  color: "#e2e8f0",
                }}
                formatter={(value) => [value, metricLabel]}
              />
              <Bar
                dataKey={metric}
                name={metricLabel}
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {isFetching && !isLoading && (
          <div className="mt-2 text-right text-[10px] text-slate-500">
            Refreshing…
          </div>
        )}
      </div>
    </div>
  );
}
