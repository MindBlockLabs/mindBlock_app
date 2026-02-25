'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Puzzle } from '@/lib/types/puzzles';

interface PuzzleCardProps {
  puzzle: Puzzle;
}

const TYPE_CONFIG = {
  logic: {
    label: 'Logic',
    icon: '🧠',
    className: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
  },
  coding: {
    label: 'Coding',
    icon: '💻',
    className: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  },
  blockchain: {
    label: 'Blockchain',
    icon: '⛓️',
    className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  },
} as const;

const DIFFICULTY_CONFIG = {
  ALL: { label: 'All', className: 'bg-slate-500/15 text-slate-300 border-slate-500/25', dot: 'bg-slate-400' },
  BEGINNER: { label: 'Beginner', className: 'bg-green-500/15 text-green-300 border-green-500/25', dot: 'bg-green-400' },
  INTERMEDIATE: { label: 'Intermediate', className: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25', dot: 'bg-yellow-400' },
  ADVANCED: { label: 'Advanced', className: 'bg-orange-500/15 text-orange-300 border-orange-500/25', dot: 'bg-orange-400' },
  EXPERT: { label: 'Expert', className: 'bg-red-500/15 text-red-300 border-red-500/25', dot: 'bg-red-500' },
} as const;

const PuzzleCard: React.FC<PuzzleCardProps> = ({ puzzle }) => {
  const router = useRouter();

  const typeConfig = TYPE_CONFIG[puzzle.type] ?? TYPE_CONFIG.logic;
  const diffConfig = DIFFICULTY_CONFIG[puzzle.difficulty] ?? DIFFICULTY_CONFIG.BEGINNER;

  return (
    <button
      onClick={() => router.push(`/puzzles/${puzzle.id}`)}
      className="w-full text-left bg-[#0A1628] border border-gray-800 rounded-xl p-5 flex flex-col gap-4 hover:border-gray-600 hover:bg-[#0d1e38] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 group"
      aria-label={`Open puzzle: ${puzzle.title}`}
    >
      {/* Badges row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Type badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${typeConfig.className}`}
        >
          <span aria-hidden="true">{typeConfig.icon}</span>
          {typeConfig.label}
        </span>

        {/* Difficulty badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${diffConfig.className}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${diffConfig.dot}`} aria-hidden="true" />
          {diffConfig.label}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-[#E6E6E6] font-semibold text-base leading-snug group-hover:text-white transition-colors">
        {puzzle.title}
      </h3>

      {/* Description */}
      <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
        {puzzle.description}
      </p>

      {/* Footer: category + time limit */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
        {puzzle.categoryId ? (
          <span className="text-xs text-blue-400 font-medium px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 truncate max-w-[60%]">
            {puzzle.categoryId}
          </span>
        ) : (
          <span />
        )}
        {puzzle.timeLimit && (
          <span className="text-xs text-gray-500 flex-shrink-0">
            {puzzle.timeLimit} min
          </span>
        )}
      </div>
    </button>
  );
};

export default PuzzleCard;
