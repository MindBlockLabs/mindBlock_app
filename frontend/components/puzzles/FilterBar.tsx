'use client';

import React from 'react';
import type { PuzzleDifficulty, PuzzleFilters } from '@/lib/types/puzzles';
import DifficultyFilter from './DifficultyFilter';
import CategoryFilter from './CategoryFilter';
import Button from '@/components/ui/Button';
import { X } from 'lucide-react';

interface FilterBarProps {
  filters: PuzzleFilters;
  onFiltersChange: (filters: PuzzleFilters) => void;
}

const DEFAULT_FILTERS: PuzzleFilters = {
  categoryId: '',
  difficulty: 'ALL',
};

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFiltersChange }) => {
  const hasActiveFilters =
    filters.categoryId !== '' || filters.difficulty !== 'ALL';

  const handleCategoryChange = (categoryId: string) => {
    onFiltersChange({ ...filters, categoryId });
  };

  const handleDifficultyChange = (difficulty: PuzzleDifficulty) => {
    onFiltersChange({ ...filters, difficulty });
  };

  const handleClearFilters = () => {
    onFiltersChange(DEFAULT_FILTERS);
  };

  return (
    <div className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap">
        {/* Category dropdown */}
        <div className="min-w-[180px] flex-1 sm:max-w-[220px]">
          <CategoryFilter
            selectedCategoryId={filters.categoryId}
            onChange={handleCategoryChange}
          />
        </div>

        {/* Difficulty pills */}
        <div className="flex-[2]">
          <DifficultyFilter
            selectedDifficulty={filters.difficulty}
            onChange={handleDifficultyChange}
          />
        </div>

        {/* Clear button — only show when a filter is active */}
        {hasActiveFilters && (
          <div className="flex-shrink-0 self-end">
            <Button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 h-10 px-3 text-sm text-slate-400 border border-white/10 bg-white/5 hover:border-white/25 hover:text-slate-200"
            >
              <X size={14} aria-hidden="true" />
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
