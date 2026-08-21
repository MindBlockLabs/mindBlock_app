"use client";

import React from "react";
import Button from "../Button";
import {
  Award,
  Clock3,
  Diamond,
  Flame,
  Target,
  Trophy,
} from "lucide-react";
import { Nunito } from "next/font/google";
import type {
  CategoryPerformanceEntry,
  GameSessionSummary,
} from "@/lib/api/gameSessionsApi";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

interface SessionCompleteScreenProps {
  session: GameSessionSummary;
  onPlayAgain: () => void;
  onViewProfile: () => void;
  onReturnHome: () => void;
}

/**
 * The "🎉 Session Complete!" screen (issue #618).
 *
 * Every value shown here comes directly from the persisted GameSession
 * returned by the backend — nothing is calculated on the frontend, so a
 * page refresh always shows the same results.
 */
export function SessionCompleteScreen({
  session,
  onPlayAgain,
  onViewProfile,
  onReturnHome,
}: SessionCompleteScreenProps) {
  const timeSpentLabel = formatDuration(session.timeSpentSeconds);
  const streakChange = getStreakChangeLabel(
    session.previousStreak,
    session.currentStreak,
  );

  return (
    <div
      className={`${nunito.className} flex flex-col items-center max-w-[640px] w-full justify-center space-y-8 md:space-y-10 px-4 py-10 animate-fade-in`}
    >
      <Header />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 w-full max-w-[520px]">
        <StatCard
          label="SCORE"
          value={session.score}
          color="#3B82F6"
          icon={<Diamond className="h-8 w-8 md:h-10 md:w-10" fill="#3B82F6" />}
          delay={0}
        />
        <StatCard
          label="XP EARNED"
          value={session.xpEarned}
          color="#A855F7"
          icon={<Award className="h-8 w-8 md:h-10 md:w-10" stroke="#A855F7" />}
          delay={80}
        />
        <StatCard
          label="ACCURACY"
          value={session.accuracy !== null ? `${session.accuracy}%` : "—"}
          color="#14B8A6"
          icon={<Target className="h-8 w-8 md:h-10 md:w-10" stroke="#14B8A6" />}
          delay={160}
        />
        <StatCard
          label="CHALLENGES"
          value={session.challengeCount}
          color="#F59E0B"
          icon={<Trophy className="h-8 w-8 md:h-10 md:w-10" stroke="#F59E0B" />}
          delay={240}
        />
        <StatCard
          label="TIME"
          value={timeSpentLabel}
          color="#EC4899"
          icon={<Clock3 className="h-8 w-8 md:h-10 md:w-10" stroke="#EC4899" />}
          delay={320}
        />
        <StatCard
          label="STREAK"
          value={session.currentStreak ?? "—"}
          color="#EF4444"
          icon={<Flame className="h-8 w-8 md:h-10 md:w-10" stroke="#EF4444" />}
          delay={400}
        />
      </div>

      {streakChange && (
        <p className="text-[#E6E6E6] text-sm md:text-base text-center animate-fade-in">
          {streakChange}
        </p>
      )}

      <CategoryPerformanceList categories={session.categoryPerformance} />

      <RewardBanner
        eligible={session.rewardEligible}
        reason={session.rewardReason}
      />

      <div className="w-full max-w-[520px] flex flex-col gap-3 animate-slide-in-from-bottom">
        <Button onClick={onPlayAgain} className="w-full" variant="primary">
          Play Again
        </Button>
        <div className="flex gap-3">
          <Button
            onClick={onViewProfile}
            className="flex-1"
            variant="secondary"
          >
            View Profile
          </Button>
          <Button
            onClick={onReturnHome}
            className="flex-1"
            variant="tertiary"
          >
            Return Home
          </Button>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="text-center flex flex-col space-y-3 md:space-y-4 animate-slide-in-from-top">
      <div className="text-6xl md:text-8xl animate-bounce-slow">🎉</div>
      <div className="flex flex-col">
        <h1 className="text-2xl md:text-[32px] tracking-wider font-black text-white">
          Session Complete!
        </h1>
        <p className="text-[#E6E6E6] text-sm md:text-base">
          Nice work, here&apos;s how you did.
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

function StatCard({ label, value, color, icon, delay = 0 }: StatCardProps) {
  return (
    <div
      className="rounded-3xl overflow-hidden animate-slide-in-from-bottom"
      style={{ backgroundColor: color, animationDelay: `${delay}ms` }}
    >
      <div className="py-1 text-center">
        <span className="text-[10px] md:text-[12px] font-black text-white tracking-widest">
          {label}
        </span>
      </div>
      <div className="bg-white flex flex-col items-center w-[96%] mx-auto rounded-3xl justify-center gap-1 py-3">
        <div>{icon}</div>
        <span style={{ color }} className="text-base md:text-xl font-black">
          {value}
        </span>
      </div>
    </div>
  );
}

function CategoryPerformanceList({
  categories,
}: {
  categories: CategoryPerformanceEntry[] | null;
}) {
  if (!categories || categories.length === 0) return null;

  return (
    <div className="w-full max-w-[520px] flex flex-col gap-2 animate-fade-in">
      <h2 className="text-[#E6E6E6] text-xs md:text-sm font-bold tracking-widest text-center uppercase">
        Category Performance
      </h2>
      <div className="flex flex-col gap-2">
        {categories.map((category) => (
          <div
            key={category.categoryId}
            className="flex items-center justify-between rounded-xl bg-[#050C16] border border-[#FFFFFF1A] px-4 py-2"
          >
            <span className="text-white text-sm font-semibold">
              {category.categoryName}
            </span>
            <span className="text-[#9CA3AF] text-sm">
              {category.correct}/{category.total} · {category.accuracy}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RewardBanner({
  eligible,
  reason,
}: {
  eligible: boolean | null;
  reason: string | null;
}) {
  if (eligible === null) return null;

  return (
    <div
      className={`w-full max-w-[520px] rounded-xl px-4 py-3 text-center text-sm font-semibold animate-fade-in ${
        eligible
          ? "bg-[#FACC15]/10 text-[#FACC15] border border-[#FACC15]/30"
          : "bg-[#FFFFFF0D] text-[#9CA3AF] border border-[#FFFFFF1A]"
      }`}
    >
      {eligible ? "🏆 Reward earned! " : "Not eligible for a reward this time. "}
      {reason}
    </div>
  );
}

function formatDuration(totalSeconds: number | null): string {
  if (totalSeconds === null || totalSeconds < 0) return "—";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function getStreakChangeLabel(
  previous: number | null,
  current: number | null,
): string | null {
  if (previous === null || current === null) return null;
  if (current > previous) return `🔥 Streak increased to ${current} days!`;
  if (current < previous) return `Streak reset to ${current} days.`;
  return `Streak holding steady at ${current} days.`;
}
