'use client';

import React from 'react';
import type { PuzzleDifficulty } from '@/lib/types/puzzles';

interface DifficultyOption {
  value: PuzzleDifficulty;
  label: string;
  dotColor: string;
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { value: 'ALL',          label: 'All',          dotColor: 'bg-slate-400' },
  { value: 'BEGINNER',     label: 'Beginner',     dotColor: 'bg-green-400' },
  { value: 'INTERMEDIATE', label: 'Intermediate', dotColor: 'bg-yellow-400' },
  { value: 'ADVANCED',     label: 'Advanced',     dotColor: 'bg-orange-400' },
  { value: 'EXPERT',       label: 'Expert',       dotColor: 'bg-red-500' },
];

interface DifficultyFilterProps {
  selectedDifficulty: PuzzleDifficulty;
  onChange: (difficulty: PuzzleDifficulty) => void;
}

const DifficultyFilter: React.FC<DifficultyFilterProps> = ({
  selectedDifficulty,
  onChange,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">
        Difficulty
      </label>
      <div className="flex flex-wrap gap-2">
        {DIFFICULTY_OPTIONS.map(({ value, label, dotColor }) => {
          const isActive = selectedDifficulty === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => onChange(value)}
              aria-pressed={isActive}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/50
                ${
                  isActive
                    ? 'border-[#3B82F6] bg-[#3B82F6]/15 text-white'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-slate-200'
                }
              `}
            >
              <span
                className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`}
                aria-hidden="true"
              />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DifficultyFilter;
