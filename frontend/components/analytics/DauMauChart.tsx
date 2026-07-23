// frontend/components/analytics/DauMauChart.tsx
"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp, CalendarRange, SlidersHorizontal, X } from "lucide-react";
import { getDauMauMetrics } from "@/lib/api/analyticsApi";

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

export default function DauMauChart() {
  const defaultRange = useMemo(getDefaultRange, []);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["dau-mau", startDate, endDate],
    queryFn: () => getDauMauMetrics({ startDate, endDate }),
  });

  function applyPreset(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  }

  const series = data?.series ?? [];
  const hasData = series.length > 0;
  const stickinessPct =
    data?.stickiness != null ? Math.round(data.stickiness * 100) : null;

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
          <h2 className="text-lg font-semibold text-white">DAU / MAU</h2>
          <p className="text-xs text-slate-400">
            Daily vs monthly active users
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

      {stickinessPct !== null && hasData && (
        <div className="mt-4 flex w-fit items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2">
          <TrendingUp className="h-4 w-4 text-blue-300" />
          <span className="text-sm text-blue-200">
            Stickiness: <strong>{stickinessPct}%</strong> (avg DAU/MAU)
          </span>
        </div>
      )}

      <div className="mt-6 h-64 w-full md:h-72">
        {isLoading && (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Loading engagement data...
          </div>
        )}

        {!isLoading && isError && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-red-400">
            <span>
              Couldn&apos;t load DAU/MAU data
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
            No activity data for this date range yet.
          </div>
        )}

        {!isLoading && !isError && hasData && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={series}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} width={36} />
              <Tooltip
                contentStyle={{
                  background: "#0A0F1A",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                  color: "#e2e8f0",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
              <Line
                type="monotone"
                dataKey="dau"
                name="DAU"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="mau"
                name="MAU"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
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