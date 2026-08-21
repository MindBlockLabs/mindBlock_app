"use client";

import { useState, useEffect } from "react";
import SideNav from "@/components/SideNav";
import { Menu } from "lucide-react";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import { useAuth } from "@/hooks/useAuth";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { restoreSession } = useAuth();

  // Restore session on app initialization
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Set up automatic token refresh
  const { refreshToken: refreshTokenAction, isAuthenticated, token } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Refresh token 5 minutes before it expires (assuming 1 hour expiration)
    const REFRESH_INTERVAL = 55 * 60 * 1000; // 55 minutes
    
    const intervalId = setInterval(() => {
      refreshTokenAction();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, token, refreshTokenAction]);

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
      <main className="flex-1">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}