"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { SessionCompleteScreen } from "@/components/session/SessionCompleteScreen";
import { useSessionCompletion } from "@/hooks/useSessionCompletion";
import { useGuestSession } from "@/hooks/useGuestSession";
import Button from "@/components/Button";

export default function SessionCompletePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session: guestSession } = useGuestSession();

  const sessionId = typeof params?.id === "string" ? params.id : undefined;
  const guestId = guestSession?.sessionId ?? null;

  const { session, isLoading, error, refetch } = useSessionCompletion(
    sessionId,
    guestId,
  );

  if (isLoading) {
    return (
      <CenteredLayout>
        <p className="text-[#E6E6E6] text-base animate-fade-in">
          Calculating your results…
        </p>
      </CenteredLayout>
    );
  }

  if (error || !session) {
    return (
      <CenteredLayout>
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <p className="text-white text-lg font-bold">
            We couldn&apos;t load your results
          </p>
          <p className="text-[#9CA3AF] text-sm">
            {error ?? "This session could not be found."}
          </p>
          <Button onClick={refetch} variant="primary">
            Try Again
          </Button>
        </div>
      </CenteredLayout>
    );
  }

  return (
    <CenteredLayout>
      <SessionCompleteScreen
        session={session}
        onPlayAgain={() => router.push("/puzzle-list")}
        onViewProfile={() => router.push("/profile")}
        onReturnHome={() => router.push("/dashboard")}
      />
    </CenteredLayout>
  );
}

function CenteredLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4">
      {children}
    </div>
  );
}
