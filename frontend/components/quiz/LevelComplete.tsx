"use client";
import React from "react";
import Button from "../Button";
import { CircleCheck, Clock3, Diamond } from "lucide-react";
import { Nunito } from "next/font/google";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

interface LevelCompleteProps {
  totalPts: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken: string;
  onClaim: () => void;
  level?: number;
}

export function LevelComplete({
  totalPts,
  correctAnswers,
  totalQuestions,
  timeTaken,
  onClaim,
  level = 3,
}: LevelCompleteProps) {
  return (
    <div className={`${nunito.className} flex flex-col items-center max-w-[566px] w-full justify-center space-y-8 md:space-y-12 px-4 animate-in fade-in zoom-in duration-500`}>
      <CompletionHeader level={level} />

      <div className="flex flex-wrap gap-3 md:gap-4 w-full max-w-[390px] md:max-w-[450px] justify-center">
        <StatCard
          label="TOTAL PTS"
          value={totalPts}
          color="#3B82F6"
          icon={<Diamond className="h-10 w-10" fill="#3B82F6" />}
          delay={0}
        />
        <StatCard
          label="NICE"
          value={`${correctAnswers}/${totalQuestions}`}
          color="#14B8A6"
          icon={<CircleCheck className="h-10 w-10" stroke="white" fill="#14B8A6" />}
          delay={100}
        />
        <StatCard
          label="TIME"
          value={timeTaken}
          color="#A855F7"
          icon={<Clock3 className="h-8 w-8" stroke="#8B5CF6" />}
          delay={200}
        />
      </div>

      <CompletionFooter onClaim={onClaim} />
    </div>
  );
}

interface CompletionHeaderProps {
  level: number;
}

export function CompletionHeader({ level }: CompletionHeaderProps) {
  return (
    <div className="text-center flex flex-col space-y-4 md:space-y-6 animate-in fade-in slide-in-from-top duration-700">
      <div className="text-7xl md:text-9xl animate-bounce-slow">🎉</div>

      <div className="flex flex-col">
        <h1 className="text-2xl md:text-[32px] tracking-wider font-black text-white">
          level complete!
        </h1>
        <p className="text-[#E6E6E6] text-sm md:text-base">
          Great job! You've cleared Level {level}.
        </p>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
  delay?: number;
}

export function StatCard({ label, value, color, icon, delay = 0 }: StatCardProps) {
  return (
    <div
      className={`flex-1 min-w-[90px] md:min-w-[105px] h-[102px] md:h-[120px] rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-500`}
      style={{ backgroundColor: color, animationDelay: `${delay}ms` }}
    >
      <div className="py-1 text-center">
        <span className="text-[12px] md:text-[14px] font-bold text-white tracking-widest">
          {label}
        </span>
      </div>
      <div className="bg-white flex items-center w-[96%] mx-auto rounded-3xl justify-center gap-1 md:gap-2 h-[68px] md:h-[85px]">
        <div>{icon}</div>
        <span style={{ color: color}} className="text-lg md:text-2xl font-black">{value}</span>
      </div>
    </div>
  );
}

interface CompletionFooterProps {
  onClaim: () => void;
  isLoading?: boolean;
}

export function CompletionFooter({ onClaim, isLoading = false }: CompletionFooterProps) {
  return (
    <div className="w-full max-w-[566px] animate-in fade-in slide-in-from-bottom duration-700 delay-300">
      <Button
        onClick={onClaim}
        disabled={isLoading}
        className="w-full"
        variant="primary"
      >
        {isLoading ? "Claiming..." : "Claim Points"}
      </Button>
    </div>
  );
}
