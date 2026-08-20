import React from "react";
import {
  FeatureCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/FeatureCard";
import { cn } from "@/lib/utils";

interface AchievementCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isUnlocked: boolean;
  className?: string;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  title,
  description,
  icon,
  isUnlocked,
  className,
}) => {
  return (
    <FeatureCard
      className={cn(
        "flex items-center space-x-4",
        !isUnlocked && "opacity-50",
        className,
      )}
    >
      <div className="text-3xl">{icon}</div>
      <div className="flex-grow">
        <CardHeader className="p-0">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardContent>
      </div>
      {isUnlocked && (
        <div className="text-2xl text-yellow-400" aria-label="Unlocked">
          🏆
        </div>
      )}
    </FeatureCard>
  );
};

export default AchievementCard;
