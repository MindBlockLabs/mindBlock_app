"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, TrendingDown } from "lucide-react";
import { getOnboardingFunnel, type OnboardingFunnelResponse } from "@/lib/analytics/analytics-client";

type FunnelStep = {
  name: string;
  count: number;
  conversionFromPrevious: string;
  dropOffPercent: number;
  isLargestDropOff: boolean;
};

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)}%`;
}

export default function OnboardingFunnelChart() {
  const { data, isLoading, isError, error, refetch } = useQuery<OnboardingFunnelResponse>({
    queryKey: ["onboarding-funnel"],
    queryFn: () => getOnboardingFunnel(),
  });

  const steps = useMemo<FunnelStep[]>(() => {
    const stages = data?.stages ?? [];

    return stages.map((stage, index) => {
      const previous = stages[index - 1];
      const previousCount = previous?.count ?? stage.count;
      const conversionFromPrevious =
        index === 0 ? 100 : previousCount > 0 ? (stage.count / previousCount) * 100 : 0;
      const dropOffPercent =
        index === 0 ? 0 : previousCount > 0 ? ((previousCount - stage.count) / previousCount) * 100 : 0;

      return {
        name: stage.name,
        count: stage.count,
        conversionFromPrevious: formatPercent(conversionFromPrevious),
        dropOffPercent,
        isLargestDropOff: false,
      };
    });
  }, [data]);

  const largestDropOffIndex = useMemo(() => {
    if (steps.length === 0) return -1;
    return steps.reduce((bestIndex, step, index) => {
      if (step.dropOffPercent > (steps[bestIndex]?.dropOffPercent ?? -1)) {
        return index;
      }
      return bestIndex;
    }, 0);
  }, [steps]);

  const highlightedSteps = useMemo(() => {
    return steps.map((step, index) => ({
      ...step,
      isLargestDropOff: index === largestDropOffIndex && step.dropOffPercent > 0,
    }));
  }, [largestDropOffIndex, steps]);

  return (
    <div className="min-w-0 rounded-2xl border border-slate-800 bg-[#101B30] p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Onboarding Funnel</h2>
          <p className="text-xs text-slate-400">
            Conversion at each onboarding step and the largest drop-off point
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading && (
          <div className="flex h-48 items-center justify-center text-sm text-slate-400">
            Loading onboarding funnel...
          </div>
        )}

        {!isLoading && isError && (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-sm text-red-400">
            <span>
              Couldn&apos;t load onboarding funnel data
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

        {!isLoading && !isError && highlightedSteps.length === 0 && (
          <div className="flex h-48 items-center justify-center text-sm text-slate-400">
            No onboarding funnel data yet.
          </div>
        )}

        {!isLoading && !isError && highlightedSteps.map((step, index) => (
          <div key={`${step.name}-${index}`} className="space-y-2">
            <div
              className={`rounded-2xl border p-4 transition ${
                step.isLargestDropOff
                  ? "border-amber-400/60 bg-amber-500/10 shadow-[0_0_0_1px_rgba(251,191,36,0.2)]"
                  : "border-slate-800 bg-[#0A0F1A]/60"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{step.name}</h3>
                    {step.isLargestDropOff && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-200">
                        <TrendingDown className="h-3 w-3" />
                        Biggest drop-off
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {step.count.toLocaleString()} users
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-100">
                    {step.conversionFromPrevious}
                  </p>
                  <p className="text-[11px] text-slate-400">from previous step</p>
                </div>
              </div>
            </div>

            {index < highlightedSteps.length - 1 && (
              <div className="flex justify-center text-slate-600">
                <ArrowDown className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
