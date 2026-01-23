"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, User, Bell } from "lucide-react";

const navItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Feeds", href: "/feeds", icon: Bell },
];

const SideNav = () => {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-72 md:min-h-screen bg-[#0B1321] border-b md:border-b-0 md:border-r border-slate-800/80 px-4 py-4 sm:px-6 sm:py-6 flex md:flex-col items-center md:items-stretch gap-4 sm:gap-6">
      <nav className="flex w-full flex-row md:flex-col justify-around md:justify-start gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center md:justify-start gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600/20 text-blue-200 shadow-inner"
                  : "text-slate-300 hover:bg-slate-800/70 hover:text-slate-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default SideNav;
