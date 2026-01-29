"use client";

import React from "react";
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

type AchievementIcon = Achievement["icon"];

const iconSrcMap: Record<AchievementIcon, string> = {
  brain: "/brain.svg",
  droplet: "/fire.svg",
  star: "/awardTag.svg",
};

function AchievementIconImg({ name }: { name: AchievementIcon }) {
  return (
    <img
      src={iconSrcMap[name]}
      alt={name}
      className="h-12 w-12"
      loading="lazy"
    />
  );
}

export function AchievementsSection({
  achievements,
  onViewAll,
}: AchievementsSectionProps) {
  return (
    <section className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Achievements</h3>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-[#3B82F6] cursor-pointer  transition-transform duration-200 hover:scale-105"
            type="button"
          >
            View All
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        {achievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            icon={<AchievementIconImg name={achievement.icon} />}
            title={achievement.title}
            date={achievement.date}
            badge={achievement.badge}
          />
        ))}
      </div>
    </section>
  );
}
