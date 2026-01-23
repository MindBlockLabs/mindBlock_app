import React from "react";
import { ArrowRight } from "lucide-react";

interface DailyQuestCardProps {
  title: string;
  questionCount: number;
  progressCurrent: number;
  progressTotal: number;
}

const DailyQuestCard = ({
  title,
  questionCount,
  progressCurrent,
  progressTotal,
}: DailyQuestCardProps) => {
  const progressPercent = Math.min(
    100,
    Math.round((progressCurrent / progressTotal) * 100)
  );

  return (
    <div className="w-full max-w-xl rounded-2xl border border-blue-500/30 bg-[#101B30] p-5 shadow-[0_0_30px_rgba(37,99,235,0.15)]">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-xl bg-[#1C335B]" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-200">{title}</p>
          <p className="mt-1 text-xs text-slate-400">{questionCount} Questions</p>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Progress</span>
              <span>{progressCurrent}/{progressTotal}</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-700/60">
              <div
                className="h-full rounded-full bg-blue-400"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default DailyQuestCard;
