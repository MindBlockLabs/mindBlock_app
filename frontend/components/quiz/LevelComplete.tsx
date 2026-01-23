"use client";
import React from "react";

interface LevelCompleteProps {
  totalPts: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken: string;
  onClaim: () => void;
}

export function LevelComplete({
  totalPts,
  correctAnswers,
  totalQuestions,
  timeTaken,
  onClaim,
}: LevelCompleteProps) {
  return (
    <div className="flex flex-col items-center max-w-[566px] justify-center space-y-12 animate-in fade-in zoom-in duration-500">
      <div className="text-center flex flex-col space-y-6">
        <div className="text-9xl">🎉</div>
        <h1 className="text-[32px] font-black  tracking-tighter ">
          level complete!
        </h1>
        <p className="text-[#E6E6E6] text-sm ">
          Great job! You’ve cleared Level 3.
        </p>
      </div>

      <div className="flex gap-4 w-[356px] ">
        <StatCard
          label="TOTAL PTS"
          value={totalPts}
          color="#3B82F6"
          icon={<span className="text-blue-400">◆</span>}
        />
        <StatCard
          label="NICE"
          value={`${correctAnswers}/${totalQuestions}`}
          color="#10B981"
          icon={<span className="text-emerald-500">✔</span>}
        />
        <StatCard
          label="TIME"
          value={timeTaken}
          color="#A855F7"
          icon={<span className="text-purple-400">🕒</span>}
        />
      </div>

      <button
        onClick={onClaim}
        style={{ boxShadow: `0 4px 0 0 #2663C7` }}
        className="w-[566px] h-[56px] bg-[#3B82F6] rounded-xl font-bold text-lg hover:bg-[#2563EB] active:translate-y-[2px] active:shadow-none transition-all"
      >
        Claim Points
      </button>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, color, icon }: StatCardProps) {
  return (
    <div className="flex-1 w-[102px] h-[86px] bg-white  rounded-[17px] overflow-hidden shadow-xl border border-white/10">
      <div style={{ backgroundColor: color }} className="py-1.5  text-center">
        <span className="text-[10px] font-black text-white rounded-t-2xl tracking-widest">
          {label}
        </span>
      </div>
      <div className="bg-white flex  items-center justify-center gap-1">
        <div className="text-[24px]">{icon}</div>
        <span className="text-xl font-black text-slate-800">{value}</span>
      </div>
    </div>
  );
}
