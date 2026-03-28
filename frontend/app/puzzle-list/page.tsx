'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import FilterBar from '@/components/puzzles/FilterBar';
import { usePuzzles } from '@/hooks/usePuzzles';
import type { PuzzleDifficulty, PuzzleFilters } from '@/lib/types/puzzles';
import { Puzzle as PuzzleIcon, Clock, Zap } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';

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

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50];

function parseFiltersFromParams(params: URLSearchParams): PuzzleFilters {
  const category  = params.get('category') ?? '';
  const rawDiff   = (params.get('difficulty') ?? '').toUpperCase() as PuzzleDifficulty;
  const difficulty = VALID_DIFFICULTIES.includes(rawDiff) ? rawDiff : 'ALL';
  return { categoryId: category, difficulty };
}

function parsePaginationFromParams(params: URLSearchParams) {
  const page = parseInt(params.get('page') ?? '1', 10);
  const itemsPerPage = parseInt(params.get('itemsPerPage') ?? '10', 10);
  return {
    currentPage: Math.max(1, page),
    itemsPerPage: ITEMS_PER_PAGE_OPTIONS.includes(itemsPerPage) ? itemsPerPage : 10,
  };
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

  const [pagination, setPagination] = useState(() =>
    parsePaginationFromParams(searchParams)
  );

  // Keep local state in sync if the browser URL changes externally (back/forward)
  useEffect(() => {
    setFilters(parseFiltersFromParams(searchParams));
    setPagination(parsePaginationFromParams(searchParams));
  }, [searchParams]);

  // Sync filters & pagination → URL
  const updateURL = useCallback(
    (nextFilters: PuzzleFilters, nextPagination: { currentPage: number; itemsPerPage: number }) => {
      const params = new URLSearchParams();
      if (nextFilters.categoryId)             params.set('category',   nextFilters.categoryId);
      if (nextFilters.difficulty !== 'ALL')   params.set('difficulty', nextFilters.difficulty);
      if (nextPagination.currentPage > 1)     params.set('page',       nextPagination.currentPage.toString());
      if (nextPagination.itemsPerPage !== 10) params.set('itemsPerPage', nextPagination.itemsPerPage.toString());

      const query = params.toString();
      router.push(query ? `/puzzle-list?${query}` : '/puzzle-list', { scroll: false });
    },
    [router],
  );

  // Sync filters → URL
  const handleFiltersChange = useCallback(
    (next: PuzzleFilters) => {
      setFilters(next);
      // Reset to page 1 when filters change
      const newPagination = { ...pagination, currentPage: 1 };
      setPagination(newPagination);
      updateURL(next, newPagination);
    },
    [pagination, updateURL],
  );

  // Handle pagination changes
  const handlePageChange = useCallback(
    (page: number) => {
      const newPagination = { ...pagination, currentPage: page };
      setPagination(newPagination);
      updateURL(filters, newPagination);
      
      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [filters, pagination, updateURL],
  );

  // Handle items per page change
  const handleItemsPerPageChange = useCallback(
    (itemsPerPage: number) => {
      const newPagination = { itemsPerPage, currentPage: 1 };
      setPagination(newPagination);
      updateURL(filters, newPagination);
    },
    [filters, updateURL],
  );

  // Build query params for usePuzzles — omit 'ALL' (no filter)
  const puzzleQuery = {
    ...(filters.categoryId  && { categoryId:  filters.categoryId }),
    ...(filters.difficulty !== 'ALL' && { difficulty: filters.difficulty }),
  };

  const { data: puzzles, isLoading, isError, error } = usePuzzles(puzzleQuery);

  // Calculate pagination
  const paginatedData = useMemo(() => {
    if (!puzzles) return [];
    
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return puzzles.slice(startIndex, endIndex);
  }, [puzzles, pagination.currentPage, pagination.itemsPerPage]);

  const totalPages = useMemo(() => {
    if (!puzzles) return 0;
    return Math.ceil(puzzles.length / pagination.itemsPerPage);
  }, [puzzles, pagination.itemsPerPage]);

  // Adjust current page if it exceeds total pages (e.g., after filtering)
  useEffect(() => {
    if (totalPages > 0 && pagination.currentPage > totalPages) {
      handlePageChange(totalPages);
    }
  }, [totalPages, pagination.currentPage, handlePageChange]);

  return (
    <>
      {/* Filter bar */}
      <div className="mb-6">
        <FilterBar filters={filters} onFiltersChange={handleFiltersChange} />
      </div>

      {/* Results count */}
      {!isLoading && !isError && puzzles && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {puzzles.length} puzzle{puzzles.length !== 1 ? 's' : ''} found
            {totalPages > 1 && (
              <span className="ml-2">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}-
                {Math.min(pagination.currentPage * pagination.itemsPerPage, puzzles.length)} of {puzzles.length}
              </span>
            )}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Items per page:</span>
              <select
                value={pagination.itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value, 10))}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-[#3B82F6]/40"
              >
                {ITEMS_PER_PAGE_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
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
          <p className="font-medium text-slate-400">No puzzles found</p>
          <p className="text-xs text-slate-600">Try clearing your filters or adjusting your search.</p>
        </div>
      )}

      {/* Puzzle grid */}
      {!isLoading && !isError && puzzles && puzzles.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedData.map((puzzle) => (
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

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic';

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
