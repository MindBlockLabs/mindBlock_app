"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DauMauChart from "@/components/analytics/DauMauChart";
import OnboardingFunnelChart from "@/src/components/analytics/OnboardingFunnelChart";
import { useAuth } from "@/hooks/useAuth";

function AnalyticsPageSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading analytics dashboard">
      <div className="animate-pulse rounded-2xl border border-slate-800 bg-[#0F172A]/70 p-6">
        <div className="h-4 w-32 rounded bg-slate-700" />
        <div className="mt-4 h-3 w-48 rounded bg-slate-800" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 rounded-xl bg-slate-800/80" />
          ))}
        </div>
      </div>
      <div className="h-80 animate-pulse rounded-2xl border border-slate-800 bg-[#0F172A]/70" />
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, isRestoring, user } = useAuth();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  useEffect(() => {
    if (isRestoring) {
      return;
    }

    const role =
      typeof window !== "undefined"
        ? window.localStorage.getItem("userRole") ??
          window.localStorage.getItem("role") ??
          (user as { role?: string; userRole?: string } | null)?.role ??
          (user as { role?: string; userRole?: string } | null)?.userRole ??
          ""
        : "";

    const isAdmin = role.toLowerCase() === "admin" || role.toLowerCase() === "super_admin";

    if (!isAuthenticated) {
      router.replace("/auth/signin");
      return;
    }

    if (!isAdmin) {
      router.replace("/dashboard");
      return;
    }

    setIsCheckingAccess(false);
  }, [isAuthenticated, isRestoring, router, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoadingContent(false), 600);
    return () => window.clearTimeout(timer);
  }, []);

  if (isCheckingAccess || isLoadingContent) {
    return <AnalyticsPageSkeleton />;
  }

  return (
    <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="min-w-0 lg:col-span-2">
        <DauMauChart />
      </div>
      <div className="min-w-0">
        <OnboardingFunnelChart />
      </div>
    </div>
  );
}