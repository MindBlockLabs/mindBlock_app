"use client";

import { X, Share2 } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@radix-ui/react-avatar";
import { FollowButton } from "./FollowButton";
import { ProfileStats } from "./ProfileStats";
import { OverviewGrid } from "./OverviewGrid";
import { AchievementPreview } from "./AchievementPreview";

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  value: string;
  date: string;
}

export interface UserProfileViewProps {
  id: string;
  username: string;
  handle: string;
  avatar: string;
  joinedDate: string;
  followingCount: number;
  followersCount: number;
  isFollowing: boolean;
  dayStreak: number;
  totalPoints: number;
  rank: number;
  challengeLevel: string;
  achievements: Achievement[];
  onFollow: () => void;
  onUnfollow: () => void;
  onShare: () => void;
  onFollowingClick: () => void;
  onFollowersClick: () => void;
  onClose: () => void;
  onViewAllAchievements: () => void;
}

export function UserProfileView(props: UserProfileViewProps) {
  const {
    username,
    handle,
    avatar,
    joinedDate,
    followingCount,
    followersCount,
    isFollowing,
    dayStreak,
    totalPoints,
    rank,
    challengeLevel,
    achievements,
    onFollow,
    onUnfollow,
    onShare,
    onFollowingClick,
    onFollowersClick,
    onClose,
    onViewAllAchievements,
  } = props;

  const initials = username
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div className="flex h-full w-full items-center justify-center bg-transparent text-[#E6E6E6]">
      <div className="relative w-full max-w-lg rounded-3xl bg-transparent px-6 py-6 shadow-xl sm:px-8 sm:py-8">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close profile"
          className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-gray-800 bg-[#050C16] text-gray-300 hover:bg-gray-800">
          <X className="h-4 w-4" />
        </button>

        <div className="mt-4 flex flex-col items-center">
          {/* Avatar & basic info */}
          <div className="flex flex-col items-center gap-1">
            <Avatar className="h-24 w-24 sm:h-28 sm:w-28">
              <AvatarImage src={avatar || "/profileAvatar.svg"} alt={username} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col items-center gap-1 text-center">
              <h2 className="text-xl font-semibold text-foreground">
                {username}
              </h2>
              <p className="text-sm text-muted-foreground">@{handle}</p>
              <p className="text-sm text-muted-foreground">
                Joined {joinedDate}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <ProfileStats
            followingCount={followingCount}
            followersCount={followersCount}
            onFollowingClick={onFollowingClick}
            onFollowersClick={onFollowersClick}
          />

          {/* Action bar */}
          <div className="mt-4 flex w-full items-center gap-3">
            <FollowButton
              isFollowing={isFollowing}
              onFollow={onFollow}
              onUnfollow={onUnfollow}
            />
            <button
              type="button"
              onClick={onShare}
              aria-label="Share profile"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-800 bg-[#050C16] text-gray-200 transition-colors hover:border-[#3B82F6] hover:text-[#3B82F6]">
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-10 w-full">
          {/* Overview grid */}
          
          <OverviewGrid
            dayStreak={dayStreak}
            totalPoints={totalPoints}
            rank={rank}
            challengeLevel={challengeLevel}
          />

          {/* Achievements preview */}
          <AchievementPreview
            achievements={achievements}
              onViewAllAchievements={onViewAllAchievements}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

