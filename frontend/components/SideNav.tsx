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


const SideNav = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const pathname = usePathname();

  return (
    <aside
      className={`
    fixed inset-y-0 left-0 z-50 w-72 bg-[#0B1321]
    transform transition-transform
    ${open ? "translate-x-0" : "-translate-x-full"}
    md:static md:translate-x-0
  `}
    >
      <div className="p-4 md:p-6">
        <button
          onClick={onClose}
          className="md:hidden self-end p-2 text-slate-300 mb-4"
        >
          ✕
        </button>
        <nav className="flex w-full flex-col justify-start gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-start gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600/20 text-blue-200 shadow-inner"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default SideNav;
