import React from "react";
import {
  FeatureCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/FeatureCard";
import { cn } from "@/lib/utils";

interface GameModeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const GameModeCard: React.FC<GameModeCardProps> = ({
  title,
  description,
  icon,
  className,
  onClick,
}) => {
  return (
    <FeatureCard
      isClickable={!!onClick}
      onClick={onClick}
      className={cn("flex flex-col items-center text-center", className)}
      variant="gradient"
    >
      <CardHeader>
        <div className="mb-4 text-4xl">{icon}</div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </FeatureCard>
  );
};

export default GameModeCard;
