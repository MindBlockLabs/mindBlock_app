"use client";

import Image from "next/image";
import { AchievementCard } from "./AchievementCard";
import type { Achievement } from "./UserProfileView";

interface AchievementPreviewProps {
  achievements: Achievement[];
  onViewAllAchievements: () => void;
}

export function AchievementPreview({
  achievements,
  onViewAllAchievements,
}: AchievementPreviewProps) {
  const visibleAchievements = achievements.slice(0, 3);

  return (
    <section className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Achievements</h3>
        <button
          type="button"
          onClick={onViewAllAchievements}
          className="text-sm text-[#3B82F6] cursor-pointer transition-transform duration-200 hover:scale-105"
        >
          View All
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 lg:justify-start">
        {visibleAchievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            icon={
              <Image
                src={achievement.icon}
                alt={achievement.title}
                width={48}
                height={48}
                className="h-12 w-12"
                loading="lazy"
              />
            }
            title={achievement.title}
            date={achievement.date}
            badge={achievement.value}
          />
        ))}
      </div>
    </section>
  );
}

