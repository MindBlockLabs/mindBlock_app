"use client";

import React, { useState } from "react";

const MOCK_HINTS = [
  "Consider breaking down the problem into smaller parts.",
  "Think about edge cases and boundary conditions.",
  "Review the input constraints carefully.",
];

export default function HintsSection() {
  const [revealedHints, setRevealedHints] = useState<number[]>([]);

  const toggleHint = (index: number) => {
    setRevealedHints((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-900/60 p-6">
      <div className="flex items-start gap-2">
        <span className="text-xl">💡</span>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-200 mb-1">Hints Available</h3>
          <p className="text-xs text-slate-400">
            {MOCK_HINTS.length} hints available • Each hint used deducts 2 XP
          </p>
        </div>
      </div>

      <div className="space-y-3 mt-4">
        {MOCK_HINTS.map((hint, index) => (
          <button
            key={index}
            onClick={() => toggleHint(index)}
            className="w-full text-left p-4 rounded-lg border border-slate-600 bg-slate-800 hover:bg-slate-750 transition-colors group"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-semibold text-slate-300 text-sm">
                Hint {index + 1}
              </span>
              <span className="text-slate-400 group-hover:text-slate-200 transition-colors">
                {revealedHints.includes(index) ? "−" : "+"}
              </span>
            </div>

            {revealedHints.includes(index) && (
              <p className="mt-3 text-slate-300 text-sm leading-relaxed">
                {hint}
              </p>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <p className="text-xs text-amber-400 flex items-start gap-2">
          <span className="text-sm mt-0.5">⚠️</span>
          <span>
            Using hints will reduce your XP reward for solving this puzzle.
          </span>
        </p>
      </div>
    </div>
  );
}
