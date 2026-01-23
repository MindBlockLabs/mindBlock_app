import React from "react";

interface DashboardHeaderProps {
  streakLabel: string;
  pointsLabel: string;
}

const DashboardHeader = ({ streakLabel, pointsLabel }: DashboardHeaderProps) => {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Dashboard Home
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
          Welcome back, Challenger.
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Keep your momentum and unlock the next reward tier.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
          <span className="text-lg">🔥</span>
          <div>
            <p className="text-xs font-semibold text-slate-400">Streak</p>
            <p className="text-sm font-semibold text-white">{streakLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
          <span className="text-lg">⭐</span>
          <div>
            <p className="text-xs font-semibold text-slate-400">Points</p>
            <p className="text-sm font-semibold text-white">{pointsLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
