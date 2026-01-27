"use client";

import { useRouter } from "next/navigation";
import DailyQuestCard from "@/components/dashboard/DailyQuestCard";
import CategoryCard from "@/components/dashboard/CategoryCard";
import Image from "next/image";
import { Flame, Gem, User } from "lucide-react";

const Dashboard = () => {
  const router = useRouter();

  const categories = [
    {
      icon: "🧩",
      name: "Puzzles",
      description: "Pattern Recognition",
      userLevel: "Level 5",
      slug: "puzzles",
    },
    {
      icon: "💻",
      name: "Coding",
      description: "Algorithm and Data Structures",
      userLevel: "Level 2",
      slug: "coding",
    },
    {
      icon: "⛓️",
      name: "Blockchain",
      description: "Crypto & Defi Concepts",
      userLevel: "Level 2",
      slug: "blockchain",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0A0F1A] text-slate-100">
  <header className="fixed top-0 left-0 right-0 z-30 w-full border-b border-slate-800/80 bg-[#0A0F1A] ">
       <div className="md:pl-72">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 md:gap-4 px-4 py-4 sm:max-w-6xl sm:px-6">
          <div className="flex items-center gap-3 pl-16 md:pl-0">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-slate-900/70">
              <Image
                src="/logo.png"
                alt="Mind Block"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xs md:text-sm font-semibold text-slate-200">
              mind block
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm">
            <div className="flex items-center gap-2 text-amber-300">
              <Flame className="h-4 w-4" />
              <span className="text-slate-200 md:inline hidden">
                3 Day Streak
              </span>
            </div>
            <div className="flex items-center gap-2 text-blue-300">
              <Gem className="h-4 w-4" />
              <span className="text-slate-200 md:inline hidden">
                1.1K Points
              </span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700/70 text-slate-100">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pt-20 pb-8 sm:max-w-6xl sm:px-6">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-6 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-300" />
              <span>3 Day Streak</span>
            </div>
            <div className="flex items-center gap-2">
              <Gem className="h-4 w-4 text-blue-300" />
              <span>1.1K Points</span>
            </div>
          </div>
          <DailyQuestCard
            title="Daily Quest"
            questionCount={5}
            progressCurrent={2}
            progressTotal={5}
          />
        </div>

        <section className="mt-10">
          <h2 className="text-base font-semibold text-white">Categories</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {categories.map((category) => (
              <CategoryCard
                key={category.slug}
                icon={category.icon}
                name={category.name}
                description={category.description}
                userLevel={category.userLevel}
                onClick={() => router.push(`/categories/${category.slug}`)}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
