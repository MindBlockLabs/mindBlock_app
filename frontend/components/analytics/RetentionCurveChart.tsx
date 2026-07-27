// frontend/components/analytics/RetentionCurveChart.tsx
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
import { CalendarRange } from "lucide-react";
import { getRetentionMetrics } from "@/lib/api/analyticsApi";

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

interface ChartDataPoint {
  cohortDate: string;
  cohortSize: number;
  day1RetentionPct: number | null;
  day7RetentionPct: number | null;
  day30RetentionPct: number | null;
}

export default function RetentionCurveChart() {
  const defaultRange = useMemo(getDefaultRange, []);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["retention", startDate, endDate],
    queryFn: () => getRetentionMetrics({ startDate, endDate }),
  });

  function applyPreset(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  }

  const chartData: ChartDataPoint[] = data?.data ?? [];
  const hasData = chartData.length > 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#101B30] p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Retention Curve</h2>
          <p className="text-xs text-slate-400">
            Day-1/7/30 retention percentages across cohorts
          </p>
        </div>

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
      </div>

      <div className="mt-6 h-72 w-full">
        {isLoading && (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Loading retention data...
          </div>
        )}

        {!isLoading && isError && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-red-400">
            <span>
              Couldn&apos;t load retention data
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
            No retention data for this date range yet.
          </div>
        )}

        {!isLoading && !isError && hasData && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="cohortDate" 
                stroke="#64748b" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="#64748b" 
                tick={{ fontSize: 12 }} 
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
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
                dataKey="day1RetentionPct"
                name="Day 1 Retention"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="day7RetentionPct"
                name="Day 7 Retention"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="day30RetentionPct"
                name="Day 30 Retention"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
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
