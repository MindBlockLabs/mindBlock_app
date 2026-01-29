import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface AchievementCardProps {
  icon: ReactNode
  title: string
  date: string
  badge?: string | number
  className?: string
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
        "flex flex-col items-center justify-center gap-2 rounded-xl bg-card border border-border p-4 min-w-[120px]",
        className
      )}
    >
      <div className="relative">
        {icon}
        {badge && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {badge}
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-foreground text-center">
        {title}
      </span>
      <span className="text-xs text-muted-foreground">{date}</span>
    </div>
  )
}
