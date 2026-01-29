"use client";

// import { AchievementCard } from "./achievement-card";
import { Brain, Droplet, Star } from "lucide-react";
import { AchievementCard } from "./AchievementCard";

interface Achievement {
  id: string;
  icon: "brain" | "droplet" | "star";
  title: string;
  date: string;
  badge?: string | number;
}

interface AchievementsSectionProps {
  achievements: Achievement[];
  onViewAll?: () => void;
}

const iconMap = {
  brain: (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/30">
      <Brain className="h-6 w-6 text-blue-400" />
    </div>
  ),
  droplet: (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/30">
      <Droplet className="h-6 w-6 text-amber-400" />
    </div>
  ),
  star: (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600/30">
      <Star className="h-6 w-6 text-green-400" />
    </div>
  ),
};

export function AchievementsSection({
  achievements,
  onViewAll,
}: AchievementsSectionProps) {
  return (
    <section className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Achievements</h3>
        <button
          onClick={onViewAll}
          className="text-sm text-primary hover:underline"
        >
          View All
        </button>
      </div>
      
      <div className="flex flex-wrap gap-4">
        {achievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            icon={iconMap[achievement.icon]}
            title={achievement.title}
            date={achievement.date}
            badge={achievement.badge}
          />
        ))}
      </div>
    </section>
  );
}
