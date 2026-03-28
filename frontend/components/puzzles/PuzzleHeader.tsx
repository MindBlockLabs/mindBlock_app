"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface PuzzleHeaderProps {
  puzzleTitle: string;
}

export default function PuzzleHeader({ puzzleTitle }: PuzzleHeaderProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors font-semibold"
      >
        <span className="text-xl">←</span>
        Back
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <button
          onClick={() => router.push("/puzzles")}
          className="hover:text-slate-200 transition-colors"
        >
          Puzzles
        </button>
        <span>/</span>
        <span className="text-slate-200">{puzzleTitle}</span>
      </nav>

      {/* Title */}
      <h1 className="text-4xl font-bold text-white mt-6">{puzzleTitle}</h1>
    </div>
  );
}
