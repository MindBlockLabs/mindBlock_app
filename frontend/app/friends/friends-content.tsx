"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FriendListItem } from "../../components/friends/FriendListItem";
import { FriendsTab, FriendsTabs } from "../../components/friends/FriendsTabs";

type Friend = {
  id: string;
  username: string;
  avatar: string;
};

const followingFriends: Friend[] = [
  { id: "f1", username: "Aaron", avatar: "/profileAvatar.svg" },
  { id: "f2", username: "Nora", avatar: "/profileAvatar.svg" },
  { id: "f3", username: "Tomi", avatar: "/profileAvatar.svg" },
  { id: "f4", username: "Maya", avatar: "/profileAvatar.svg" },
  { id: "f5", username: "Kareem", avatar: "/profileAvatar.svg" },
];

const followerFriends: Friend[] = [
  { id: "r1", username: "Aisha", avatar: "/profileAvatar.svg" },
  { id: "r2", username: "Daniel", avatar: "/profileAvatar.svg" },
  { id: "r3", username: "Pearl", avatar: "/profileAvatar.svg" },
  { id: "r4", username: "Ife", avatar: "/profileAvatar.svg" },
  { id: "r5", username: "Levi", avatar: "/profileAvatar.svg" },
];

const parseTab = (value: string | null): FriendsTab =>
  value === "followers" ? "followers" : "following";

export default function FriendsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultTab = parseTab(tabParam);
  const [activeTab, setActiveTab] = useState<FriendsTab>(defaultTab);

  useEffect(() => {
    setActiveTab(parseTab(tabParam));
  }, [tabParam]);

  const friends = useMemo(
    () => (activeTab === "following" ? followingFriends : followerFriends),
    [activeTab]
  );

  const handleTabChange = (tab: FriendsTab) => {
    setActiveTab(tab);
    router.replace(`/friends?tab=${tab}`);
  };

  return (
    <div className="min-h-screen w-full bg-[#0A0F1A] px-4 py-8 text-slate-100 sm:px-6">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-[#CBD2D9]/15 bg-[#0F172A]/90 p-5 shadow-[0_10px_25px_rgba(2,6,23,0.35)] sm:p-7">
        <h1 className="text-[28px] font-semibold text-[#F8FAFC]">Friends</h1>

        <FriendsTabs activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="mt-4 divide-y divide-[#CBD2D9]/15">
          {friends.map((friend) => (
            <FriendListItem
              key={friend.id}
              avatar={friend.avatar}
              username={friend.username}
              onClick={() => router.push(`/profile?user=${friend.username.toLowerCase()}`)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => router.push("/friends/add")}
          className="mt-8 text-sm font-semibold text-[#3B82F6] transition-colors hover:text-[#60A5FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
        >
          Add Friends +
        </button>
      </div>
    </div>
  );
}
