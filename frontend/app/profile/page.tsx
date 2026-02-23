"use client";
//_________________________________________________________//

        // This Page will be adjusted after the wave 
//_________________________________________________________//



import Button from "@/components/Button";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { AchievementsSection } from "@/components/profile/AchievementSection";

// Mock data - in a real app, this would come from props or API
const mockUserData = {
  avatarUrl: "",
  name: "Adeyemi Shola",
  handle: "Shola",
  joinDate: "Joined August 2025",
  following: 5,
  followers: 5,
  walletId: "Fcwy...Ol5K",
};

const mockOverviewData = {
  dayStreak: 3,
  totalPoints: 830,
  rank: 8,
  challengeLevel: "Advanced",
};

const mockAchievements = [
  {
    id: "1",
    icon: "brain" as const,
    title: "Perfect Lessons",
    date: "Aug 23, 2025",
  },
  {
    id: "2",
    icon: "droplet" as const,
    title: "Longest Streak",
    date: "Aug 23, 2025",
    badge: "#3",
  },
  {
    id: "3",
    icon: "star" as const,
    title: "Perfect Week",
    date: "Aug 23, 2025",
    badge: 1,
  },
];

export default function ProfilePage() {
  const handleLogout = () => {
    // UI only - no actual logout logic
    console.log("Logout clicked");
  };

  const handleViewAllAchievements = () => {
    // UI only - no actual navigation
    console.log("View all achievements clicked");
  };

  return (
    <div className="min-h-screen grid  bg-[#0A0F1A] ">
      <div className="p-8 max-w-6xl ">
        {/* Page Header */}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Profile Info & Overview */}
          <div className=" gap-8">
            {/* Profile Header Card */}
            <div className="rounded-2xl bg-card">
              <ProfileHeader
                avatarUrl={mockUserData.avatarUrl}
                name={mockUserData.name}
                handle={mockUserData.handle}
                joinDate={mockUserData.joinDate}
                following={mockUserData.following}
                followers={mockUserData.followers}
                walletId={mockUserData.walletId}
              />
            </div>

            {/* Overview Section */}
            <ProfileOverview
              dayStreak={mockOverviewData.dayStreak}
              totalPoints={mockOverviewData.totalPoints}
              rank={mockOverviewData.rank}
              challengeLevel={mockOverviewData.challengeLevel}
            />
          </div>

          {/* Right Column - Achievements & Logout */}
          <div className="flex flex-col gap-6">
            {/* Achievements Section */}
            <AchievementsSection
              achievements={mockAchievements}
              onViewAll={handleViewAllAchievements}
            />

            {/* Logout Button */}
            <Button
              variant="logOut"
              className="w-full border-primary text-primary hover:bg-primary/10 gap-2 "
              onClick={handleLogout}
            >
              <div className="h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

