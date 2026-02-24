'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FilterBar from '@/components/puzzles/FilterBar';
import { usePuzzles } from '@/hooks/usePuzzles';
import type { PuzzleDifficulty, PuzzleFilters } from '@/lib/types/puzzles';
import { Puzzle as PuzzleIcon, Clock, Zap } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER:     'text-green-400 bg-green-400/10 border-green-400/20',
  INTERMEDIATE: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  ADVANCED:     'text-orange-400 bg-orange-400/10 border-orange-400/20',
  EXPERT:       'text-red-400 bg-red-400/10 border-red-400/20',
};

const VALID_DIFFICULTIES: PuzzleDifficulty[] = [
  'ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT',
];

function parseFiltersFromParams(params: URLSearchParams): PuzzleFilters {
  const category  = params.get('category') ?? '';
  const rawDiff   = (params.get('difficulty') ?? '').toUpperCase() as PuzzleDifficulty;
  const difficulty = VALID_DIFFICULTIES.includes(rawDiff) ? rawDiff : 'ALL';
  return { categoryId: category, difficulty };
}

// ─── Puzzle Card ─────────────────────────────────────────────────────────────

interface PuzzleCardProps {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  type: string;
  timeLimit?: number;
}

const PuzzleCard: React.FC<PuzzleCardProps> = ({
  title,
  description,
  difficulty,
  type,
  timeLimit,
}) => {
  const diffClass = DIFFICULTY_COLORS[difficulty] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20';

  return (
    <article className="group flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-[#3B82F6]/40 hover:bg-white/[0.06] transition-all duration-200 cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-100 group-hover:text-white transition-colors line-clamp-1">
          {title}
        </h3>
        <span
          className={`flex-shrink-0 text-[10px] font-bold uppercase tracking-wide border rounded-full px-2 py-0.5 ${diffClass}`}
        >
          {difficulty}
        </span>
      </div>

      <p className="text-xs text-slate-400 line-clamp-2">{description}</p>

      <div className="flex items-center gap-3 mt-auto pt-1 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Zap size={12} aria-hidden="true" />
          {type}
        </span>
        {timeLimit != null && (
          <span className="flex items-center gap-1">
            <Clock size={12} aria-hidden="true" />
            {timeLimit}s
          </span>
        )}
      </div>
    </article>
  );
};

// ─── Main Content Component (Uses useSearchParams) ──────────────────────────────

function PuzzleListContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<PuzzleFilters>(() =>
    parseFiltersFromParams(searchParams)
  );

  // Keep local state in sync if the browser URL changes externally (back/forward)
  useEffect(() => {
    setFilters(parseFiltersFromParams(searchParams));
  }, [searchParams]);

  // Sync filters → URL
  const handleFiltersChange = useCallback(
    (next: PuzzleFilters) => {
      setFilters(next);

      const params = new URLSearchParams();
      if (next.categoryId)             params.set('category',   next.categoryId);
      if (next.difficulty !== 'ALL')   params.set('difficulty', next.difficulty);

      const query = params.toString();
      router.push(query ? `/puzzle-list?${query}` : '/puzzle-list', { scroll: false });
    },
    [router],
  );

  // Build query params for usePuzzles — omit 'ALL' (no filter)
  const puzzleQuery = {
    ...(filters.categoryId  && { categoryId:  filters.categoryId }),
    ...(filters.difficulty !== 'ALL' && { difficulty: filters.difficulty }),
  };

  const { data: puzzles, isLoading, isError, error } = usePuzzles(puzzleQuery);

  return (
    <>
      {/* Filter bar */}
      <div className="mb-6">
        <FilterBar filters={filters} onFiltersChange={handleFiltersChange} />
      </div>

      {/* Results count */}
      {!isLoading && !isError && puzzles && (
        <p className="mb-4 text-xs text-slate-500">
          {puzzles.length} puzzle{puzzles.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading puzzles">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-xl border border-white/5 bg-white/[0.03] animate-pulse"
              aria-hidden="true"
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <p className="text-red-400 font-medium">Failed to load puzzles</p>
          <p className="text-xs text-slate-500">
            {error instanceof Error ? error.message : 'Please try again later.'}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && puzzles?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <PuzzleIcon className="h-10 w-10 text-slate-600" />
          <p className="font-medium text-slate-400">No puzzles match your filters</p>
          <p className="text-xs text-slate-600">Try adjusting the difficulty or category</p>
        </div>
      )}

      {/* Puzzle grid */}
      {!isLoading && !isError && puzzles && puzzles.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {puzzles.map((puzzle) => (
            <PuzzleCard
              key={puzzle.id}
              id={puzzle.id}
              title={puzzle.title}
              description={puzzle.description}
              difficulty={puzzle.difficulty}
              type={puzzle.type}
              timeLimit={puzzle.timeLimit}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PuzzleListPage() {
  return (
    <div className="min-h-screen w-full bg-[#0A0F1A] text-slate-100">
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        {/* Page header */}
        <div className="mb-6 flex items-center gap-3">
          <PuzzleIcon className="h-6 w-6 text-[#3B82F6]" />
          <h1 className="text-xl font-bold text-white">Puzzles</h1>
        </div>

        <React.Suspense
          fallback={
            <div className="flex justify-center p-8">
              <p className="text-slate-400">Loading filters...</p>
            </div>
          }
        >
          <PuzzleListContent />
        </React.Suspense>
      </main>
    </div>
  );
}
