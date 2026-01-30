"use client";

import Link from "next/link";
import { Pencil, Share2, Copy, Settings } from "lucide-react";
import Button from "../Button";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

interface ProfileHeaderProps {
  avatarUrl?: string;
  name: string;
  handle: string;
  joinDate: string;
  following: number;
  followers: number;
  walletId: string;
}

export function ProfileHeader({
  avatarUrl,
  name,
  handle,
  joinDate,
  following,
  followers,
  walletId,
}: ProfileHeaderProps) {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold ">Profile</h1>
        <button
          className="flex h-10 w-10  items-center justify-center rounded-full bg-card cursor-pointer hover:bg-[#3B82F666]"
          aria-label="Settings"
        >
          <Settings className="h-6 w-6 text-[#3B82F6] " />
        </button>
      </div>

      <div className="flex flex-col items-center gap-4">

        {/* Avatar with edit badge */}
        <div className="relative cursor-pointer ">
          <Avatar className="size-24">
            <AvatarImage src={avatarUrl || "/profileAvatar.svg"} alt={name} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800">
              {name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <button
            className="absolute top-0 right-0 flex h-5 w-5 items-center cursor-pointer justify-center rounded-full bg-[#3B82F6] hover:bg-[#3B82F666] shadow-md"
            aria-label="Edit avatar"
          >
            <Pencil className="h-3 w-3 font-bold" />
          </button>
        </div>

        {/* User info */}
        <div className="flex flex-col items-center gap-1 text-center">
          <h2 className="text-xl font-semibold text-foreground">{name}</h2>
          <p className="text-sm text-muted-foreground">@{handle}</p>
          <p className="text-sm text-muted-foreground">{joinDate}</p>
        </div>

        {/* Following / Followers */}
        <div className="flex items-center text-[#3B82F6] gap-4">
          <Link
            href="/friends?tab=following"
            className="text-sm text-primary hover:underline"
          >
            <span className="font-semibold">{following}</span> Following
          </Link>
          <Link
            href="/friends?tab=followers"
            className="text-sm text-primary hover:underline"
          >
            <span className="font-semibold">{followers}</span> Followers
          </Link>
        </div>

        {/* Wallet ID */}
        <div className="flex items-center gap-2 text-[#8B5CF6] cursor-pointer rounded-lg bg-secondary px-3 py-2">
          <Copy className="h-4 w-4 " />
          <span className="text-sm ">
            {walletId}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 font-bold w-full text-sm max-w-xs">
          <Button className="flex-1 gap-2 " variant="tertiary">
            <Pencil className="h-4 w-10 " />
            Edit Profile
          </Button>
          <Button type="button" variant="tertiary" className="px-2">
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Share profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
