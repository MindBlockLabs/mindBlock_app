import { Flame, Diamond, Trophy, Zap } from "lucide-react";
import { StatCard } from "./StatCard";

interface ProfileOverviewProps {
  dayStreak: number;
  totalPoints: number;
  rank: number;
  challengeLevel: string;
}

export function ProfileOverview({
  dayStreak,
  totalPoints,
  rank,
  challengeLevel,
}: ProfileOverviewProps) {
  return (
    <section className="w-full">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Overview</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
              <Flame className="h-5 w-5 text-amber-500" />
            </div>
          }
          value={dayStreak}
          label="Day streak"
        />
        <StatCard
          icon={
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
              <Diamond className="h-5 w-5 text-cyan-500" />
            </div>
          }
          value={totalPoints}
          label="Total Points"
        />
        <StatCard
          icon={
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
              <Trophy className="h-5 w-5 text-purple-500" />
            </div>
          }
          value={`#${rank}`}
          label="Rank"
        />
        <StatCard
          icon={
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20">
              <Zap className="h-5 w-5 text-teal-500" />
            </div>
          }
          value={challengeLevel}
          label="Challenge Level"
        />
      </div>
    </section>
  );
}
