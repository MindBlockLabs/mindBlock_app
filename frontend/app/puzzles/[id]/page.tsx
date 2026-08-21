"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePuzzle } from "@/hooks/usePuzzles";
import HintsSection from "@/components/puzzles/HintsSection";
import PuzzleHeader from "@/components/puzzles/PuzzleHeader";
import PuzzleInfoCard from "@/components/puzzles/PuzzleInfoCard";
import { ErrorState, LoadingState } from "@/components/ui/StateDisplay";

export default function PuzzleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const puzzleId = params.id as string;
  const [showHints, setShowHints] = useState(false);

  const { data: puzzle, isLoading, error } = usePuzzle(puzzleId);

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 text-slate-100"><LoadingState message="Loading puzzle..." /></div>;
  }

  if (error || !puzzle) {
    return <div className="min-h-screen bg-slate-950 text-slate-100"><ErrorState message="Failed to load puzzle details." onRetry={() => router.back()} /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <PuzzleHeader puzzleTitle={puzzle.title} />

        <main className="space-y-6 mt-8">
          <PuzzleInfoCard puzzle={puzzle} />

          <div className="space-y-4">
            <button
              onClick={() => setShowHints(!showHints)}
              className="w-full py-3 px-6 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold transition-colors text-left"
            >
              {showHints ? "Hide Hints" : "Show Hints"}
            </button>
            {showHints && <HintsSection />}
          </div>

          <button
            onClick={() => router.push(`/puzzles/${puzzle.id}/solve`)}
            style={{ boxShadow: `0 4px 0 0 #1e40af` }}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-white transition-all active:translate-y-1"
          >
            Start Puzzle
          </button>
        </main>
      </div>
    </div>
  );
}
