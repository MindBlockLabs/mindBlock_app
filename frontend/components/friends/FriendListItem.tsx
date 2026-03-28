"use client";

import { ChevronRight } from "lucide-react";
import Image from "next/image";

interface FriendListItemProps {
  avatar: string;
  username: string;
  onClick: () => void;
}

export function FriendListItem({ avatar, username, onClick }: FriendListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-4 text-left transition-colors hover:bg-[#1E293B]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
      aria-label={`Open ${username}'s profile`}
    >
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 overflow-hidden rounded-full border border-[#CBD2D9]/20 bg-[#0B172A]">
          <Image
            src={avatar}
            alt={username}
            fill
            sizes="44px"
            className="object-cover"
          />
        </div>
        <span className="text-[16px] font-semibold text-[#F8FAFC]">{username}</span>
      </div>

      <ChevronRight className="h-5 w-5 text-[#CBD2D9]" />
    </button>
  );
}
