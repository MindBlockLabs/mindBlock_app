'use client';

import React, { useState } from 'react';
import { usePuzzles } from '@/hooks/usePuzzles';
import PuzzleCard from '@/components/puzzles/PuzzleCard';
import FilterBar from '@/components/puzzles/FilterBar';
import type { PuzzleFilters } from '@/lib/types/puzzles';
import { EmptyState, ErrorState } from '@/components/ui/StateDisplay';

const DEFAULT_FILTERS: PuzzleFilters = {
  categoryId: '',
  difficulty: 'ALL',
};

// Skeleton card to match PuzzleCard proportions
const PuzzleCardSkeleton: React.FC = () => (
  <div className="bg-[#0A1628] border border-gray-800 rounded-xl p-5 flex flex-col gap-4 animate-pulse">
    {/* Badge row */}
    <div className="flex gap-2">
      <div className="h-6 w-16 rounded-full bg-white/10" />
      <div className="h-6 w-20 rounded-full bg-white/10" />
    </div>
    {/* Title */}
    <div className="h-5 w-3/4 rounded bg-white/10" />
    {/* Description lines */}
    <div className="flex flex-col gap-2">
      <div className="h-3.5 w-full rounded bg-white/10" />
      <div className="h-3.5 w-5/6 rounded bg-white/10" />
    </div>
    {/* Footer */}
    <div className="flex justify-between pt-2 border-t border-white/5">
      <div className="h-5 w-20 rounded-full bg-white/10" />
      <div className="h-4 w-12 rounded bg-white/10" />
    </div>
  </div>
);

const PuzzleListPage: React.FC = () => {
  const [filters, setFilters] = useState<PuzzleFilters>(DEFAULT_FILTERS);

  const queryParams = {
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.difficulty !== 'ALL' ? { difficulty: filters.difficulty } : {}),
  };

  const { data: puzzles, isLoading, isError, refetch } = usePuzzles(queryParams);

  return (
    <div className="min-h-screen bg-[#050C16] text-white px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#E6E6E6]">Puzzles</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Challenge yourself with logic, coding, and blockchain puzzles.
          </p>
        </div>

        {/* Filter bar */}
        <div className="mb-6">
          <FilterBar filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Error state */}
        {isError && (
          <ErrorState message="Failed to load puzzles." onRetry={() => refetch()} />
        )}

        {/* Skeleton grid while loading */}
        {isLoading && (
          <div className="grid min-h-[26rem] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Loading puzzles">
            {Array.from({ length: 6 }).map((_, i) => (
              <PuzzleCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Puzzle grid */}
        {!isLoading && !isError && (
          <>
            {puzzles && puzzles.length > 0 ? (
              <>
                <p className="text-xs text-gray-500 mb-4">
                  {puzzles.length} puzzle{puzzles.length !== 1 ? 's' : ''} found
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {puzzles.map((puzzle) => (
                    <PuzzleCard key={puzzle.id} puzzle={puzzle} />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                title="No puzzles found"
                message="Try adjusting your filters to discover another challenge."
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PuzzleListPage;
