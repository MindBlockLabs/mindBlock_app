"use client";

interface ProfileStatsProps {
  followingCount: number;
  followersCount: number;
  onFollowingClick: () => void;
  onFollowersClick: () => void;
}

export function ProfileStats({
  followingCount,
  followersCount,
  onFollowingClick,
  onFollowersClick,
}: ProfileStatsProps) {
  return (
    <div className="mt-4 flex items-center justify-center gap-4 text-sm text-[#3B82F6]">
      <button
        type="button"
        onClick={onFollowingClick}
        className="cursor-pointer transition-colors hover:text-blue-300"
      >
        <span className="font-semibold">{followingCount}</span>{" "}
        <span className="text-xs sm:text-sm">Following</span>
      </button>
      <button
        type="button"
        onClick={onFollowersClick}
        className="cursor-pointer transition-colors hover:text-blue-300"
      >
        <span className="font-semibold">{followersCount}</span>{" "}
        <span className="text-xs sm:text-sm">Followers</span>
      </button>
    </div>
  );
}

