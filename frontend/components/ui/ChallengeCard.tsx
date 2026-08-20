import React from "react";
import {
  FeatureCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/FeatureCard";
import { cn } from "@/lib/utils";

interface ChallengeCardProps {
  title: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  reward: string;
  className?: string;
  onClick?: () => void;
}

const difficultyConfig = {
  Beginner: "text-green-400",
  Intermediate: "text-yellow-400",
  Advanced: "text-orange-400",
  Expert: "text-red-400",
};

const ChallengeCard: React.FC<ChallengeCardProps> = ({
  title,
  description,
  difficulty,
  reward,
  className,
  onClick,
}) => {
  return (
    <FeatureCard
      isClickable={!!onClick}
      onClick={onClick}
      className={cn(className)}
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className={cn("font-semibold", difficultyConfig[difficulty])}>
            {difficulty}
          </span>
          <span className="text-sm text-gray-400">{reward}</span>
        </div>
      </CardContent>
    </FeatureCard>
  );
};

export default ChallengeCard;
