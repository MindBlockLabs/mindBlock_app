'use client';

import React from 'react';
import Link from 'next/link';
import type { Puzzle } from '@/lib/types/puzzles';

const difficultyConfig: Record<string, { color: string; label: string }> = {
    easy: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Easy' },
    medium: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Medium' },
    hard: { color: 'bg-rose-500/20 text-rose-400 border-rose-500/30', label: 'Hard' },
};

const typeConfig: Record<string, { icon: string; label: string }> = {
    logic: { icon: '🧠', label: 'Logic' },
    coding: { icon: '💻', label: 'Coding' },
    blockchain: { icon: '⛓️', label: 'Blockchain' },
};

interface PuzzleCardProps {
    puzzle: Puzzle;
}

const PuzzleCard: React.FC<PuzzleCardProps> = ({ puzzle }) => {
    const diff = difficultyConfig[puzzle.difficulty] ?? difficultyConfig.easy;
    const type = typeConfig[puzzle.type] ?? typeConfig.logic;
    const points = puzzle.difficulty === 'easy' ? 10 : puzzle.difficulty === 'medium' ? 25 : 50;

    return (
        <Link href={`/puzzles/${puzzle.id}`}>
            <div className="group relative bg-[#0A1628] border border-gray-800 rounded-xl p-5 flex flex-col justify-between h-full transition-all duration-300 hover:border-blue-500/40 hover:bg-[#0D1D33] hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5 cursor-pointer">
                {/* Badges */}
                <div>
                    <div className="flex gap-2 mb-3">
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/5 text-gray-300 border border-white/10">
                            {type.icon} {type.label}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${diff.color}`}>
                            {diff.label}
                        </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-[#E6E6E6] mb-1.5 transition-colors group-hover:text-blue-300">
                        {puzzle.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-4">
                        {puzzle.description}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-xs font-bold text-yellow-400">+{points} XP</span>
                    <span className="text-xs text-gray-500">Solve →</span>
                </div>
            </div>
        </Link>
    );
};

export default PuzzleCard;
