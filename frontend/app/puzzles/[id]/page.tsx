"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePuzzle } from "@/hooks/usePuzzles";
import HintsSection from "@/components/puzzles/HintsSection";
import PuzzleHeader from "@/components/puzzles/PuzzleHeader";
import PuzzleInfoCard from "@/components/puzzles/PuzzleInfoCard";

export default function PuzzleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const puzzleId = params.id as string;
  const [showHints, setShowHints] = useState(false);

  const { data: puzzle, isLoading, error } = usePuzzle(puzzleId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading puzzle...</p>
        </div>
      </div>
    );
  }

  if (error || !puzzle) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-slate-400 mb-6">Failed to load puzzle details</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
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
