import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AchievementCardProps {
  icon: ReactNode;
  title: string;
  date: string;
  badge?: string | number;
  className?: string;
}

export function AchievementCard({
  icon,
  title,
  date,
  badge,
  className,
}: AchievementCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-xl bg-card border border-[#E6E6E64D] py-5 px-2 min-w-[100px] cursor-pointer transition-transform duration-200 hover:scale-105",
        className,
      )}
    >
      <div className="flex  items-center justify-center">{icon}</div>
      {badge && (
        <span className="text-xs flex items-center justify-center">
          {badge}
        </span>
      )}
      <span className="text-xs text-center">{title}</span>
      <span className="text-[10px] text-muted-foreground">{date}</span>
    </div>
  );
}
