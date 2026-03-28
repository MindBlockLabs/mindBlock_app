"use client";

import { UserCheck, UserPlus } from "lucide-react";
import Button from "../Button";

interface FollowButtonProps {
  isFollowing: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
}

export function FollowButton({
  isFollowing,
  onFollow,
  onUnfollow,
}: FollowButtonProps) {
  const handleClick = () => {
    if (isFollowing) {
      onUnfollow();
    } else {
      onFollow();
    }
  };

  const Icon = isFollowing ? UserCheck : UserPlus;

  if (isFollowing) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex flex-1 min-w-0 items-center justify-center gap-2 rounded-xl border border-gray-800 bg-transparent py-3 px-6 text-sm font-medium text-[#8B5CF6] transition-colors hover:border-gray-700"
      >
        <Icon className="h-4 w-4" />
        <span>Following</span>
      </button>
    );
  }

  return (
    <Button type="button" variant="primary" onClick={handleClick} className="flex-1 min-w-0">
      <span className="flex items-center justify-center gap-2 text-sm font-medium">
        <UserPlus className="h-4 w-4" />
        <span>Follow</span>
      </span>
    </Button>
  );
}

