"use client";

import { useState } from "react";
import SideNav from "@/components/SideNav";
import { Menu } from "lucide-react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0A0F1A] text-slate-100 flex flex-col md:flex-row">
      <SideNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <button
        aria-label="Open navigation menu"
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-2 left-4 z-40 p-3 text-white
             focus-visible:outline-none
             focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Menu className="h-9 w-9" />
      </button>
      <main className="flex-1">{children}</main>
    </div>
  );
}
