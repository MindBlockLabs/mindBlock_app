'use client';

import React from 'react';
import type { PuzzleFilters } from '@/lib/types/puzzles';

interface FilterBarProps {
    filters: PuzzleFilters;
    onFiltersChange: (filters: PuzzleFilters) => void;
}

const difficulties = [
    { value: 'ALL', label: 'All Levels' },
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
];

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFiltersChange }) => {
    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Difficulty filter */}
            <div className="flex gap-1.5 rounded-lg bg-[#0A1628] border border-gray-800 p-1">
                {difficulties.map((d) => (
                    <button
                        key={d.value}
                        onClick={() => onFiltersChange({ ...filters, difficulty: d.value })}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${filters.difficulty === d.value
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                            }`}
                    >
                        {d.label}
                    </button>
                ))}
            </div>

            {/* Active filter indicator */}
            {filters.difficulty !== 'ALL' && (
                <button
                    onClick={() => onFiltersChange({ ...filters, difficulty: 'ALL', categoryId: '' })}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
                >
                    ✕ Clear filters
                </button>
            )}
        </div>
    );
};

export default FilterBar;
