"use client";

export type FriendsTab = "following" | "followers";

interface FriendsTabsProps {
  activeTab: FriendsTab;
  onTabChange: (tab: FriendsTab) => void;
}

export function FriendsTabs({ activeTab, onTabChange }: FriendsTabsProps) {
  const tabs: FriendsTab[] = ["following", "followers"];

  return (
    <div
      className="mt-6 grid grid-cols-2 rounded-2xl border border-[#CBD2D9]/20 bg-[#0F172A] p-1"
      role="tablist"
      aria-label="Friends Tabs"
    >
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        const label = tab === "following" ? "Following" : "Followers";

        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab)}
            className={`rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
              isActive
                ? "bg-[#3B82F6] text-white"
                : "text-[#CBD2D9] hover:bg-[#1E293B] hover:text-[#F8FAFC]"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
