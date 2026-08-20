import React from "react";
import {
  FeatureCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/FeatureCard";
import { cn } from "@/lib/utils";

interface RewardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isClaimed: boolean;
  className?: string;
  onClick?: () => void;
}

const RewardCard: React.FC<RewardCardProps> = ({
  title,
  description,
  icon,
  isClaimed,
  className,
  onClick,
}) => {
  return (
    <FeatureCard
      isClickable={!isClaimed && !!onClick}
      onClick={isClaimed ? undefined : onClick}
      className={cn(
        "flex flex-col items-center text-center",
        isClaimed && "opacity-50",
        className,
      )}
    >
      <CardHeader>
        <div className="mb-4 text-4xl">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
        {isClaimed && (
          <div className="mt-2 text-sm font-semibold text-green-400">
            Claimed
          </div>
        )}
      </CardContent>
    </FeatureCard>
  );
};

export default RewardCard;
