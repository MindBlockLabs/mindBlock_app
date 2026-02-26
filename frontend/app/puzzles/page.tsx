"use client";

import React, { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { usePuzzles } from "@/hooks/usePuzzles";
import { Puzzle } from "@/lib/types/puzzles";
import Pagination from "@/components/ui/Pagination";

// ──────────────────────────────────────────────
// Difficulty badge config
// ──────────────────────────────────────────────
const difficultyConfig: Record<
  string,
  { color: string; stars: string; label: string }
> = {
  easy: {
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    stars: "★☆☆",
    label: "Easy",
  },
  medium: {
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    stars: "★★☆",
    label: "Medium",
  },
  hard: {
    color: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    stars: "★★★",
    label: "Hard",
  },
};

const typeConfig: Record<string, { icon: string; label: string }> = {
  logic: { icon: "🧠", label: "Logic" },
  coding: { icon: "💻", label: "Coding" },
  blockchain: { icon: "⛓️", label: "Blockchain" },
};

// ──────────────────────────────────────────────
// Puzzle Card Component
// ──────────────────────────────────────────────
function PuzzleCard({ puzzle }: { puzzle: Puzzle }) {
  const diff = difficultyConfig[puzzle.difficulty] ?? difficultyConfig.easy;
  const type = typeConfig[puzzle.type] ?? typeConfig.logic;
  const points =
    puzzle.difficulty === "easy"
      ? 10
      : puzzle.difficulty === "medium"
        ? 25
        : 50;

  return (
    <Link href={`/puzzles/${puzzle.id}`}>
      <div className="group relative flex flex-col justify-between rounded-xl border border-slate-700/80 bg-slate-900/60 p-5 transition-all duration-300 hover:border-blue-500/40 hover:bg-slate-800/70 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5 cursor-pointer h-full">
        {/* Header */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-2xl">{type.icon}</span>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${diff.color}`}
            >
              {diff.stars}
            </span>
          </div>

          <h3 className="mb-1.5 text-lg font-bold text-white transition-colors group-hover:text-blue-300">
            {puzzle.title}
          </h3>

          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-slate-400">
            {puzzle.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-700/60 pt-3">
          <span className="text-xs font-medium text-slate-500">
            {type.label} • {diff.label}
          </span>
          <span className="text-xs font-bold text-yellow-400">+{points} XP</span>
        </div>

        {/* Subtle glow on hover */}
        <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
      </div>
    </Link>
  );
}

// ──────────────────────────────────────────────
// Empty State Component
// ──────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      <div className="mb-4 text-6xl">🧩</div>
      <h2 className="mb-2 text-2xl font-bold text-slate-200">
        No puzzles found
      </h2>
      <p className="max-w-md text-slate-400">
        Try clearing filters or check back later for new challenges.
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// Loading Skeleton
// ──────────────────────────────────────────────
function PuzzleSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-slate-700/50 bg-slate-900/40 p-5"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="h-8 w-8 rounded-lg bg-slate-700/60" />
            <div className="h-5 w-14 rounded-full bg-slate-700/60" />
          </div>
          <div className="mb-2 h-5 w-3/4 rounded bg-slate-700/60" />
          <div className="mb-4 space-y-2">
            <div className="h-3 w-full rounded bg-slate-700/40" />
            <div className="h-3 w-2/3 rounded bg-slate-700/40" />
          </div>
          <div className="border-t border-slate-700/40 pt-3">
            <div className="h-3 w-1/2 rounded bg-slate-700/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main Puzzle List Page
// ──────────────────────────────────────────────
function PuzzlesContent() {
  const searchParams = useSearchParams();

  // Parse initial page from URL
  const initialPage = useMemo(() => {
    const pageParam = searchParams.get("page");
    const parsed = pageParam ? parseInt(pageParam, 10) : 1;
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }, [searchParams]);

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch all puzzles
  const { data: puzzles = [], isLoading, isError } = usePuzzles({});

  // Compute pagination
  const totalPages = Math.max(1, Math.ceil(puzzles.length / itemsPerPage));

  // Clamp currentPage if it exceeds totalPages (e.g. after data changes)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Slice puzzles for current page
  const paginatedPuzzles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return puzzles.slice(startIndex, startIndex + itemsPerPage);
  }, [puzzles, currentPage, itemsPerPage]);

  // Update URL query parameter
  const syncUrlPage = useCallback((page: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(page));
    window.history.replaceState({}, "", url.toString());
  }, []);

  // Handle page change
  const handlePageChange = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(clamped);
      syncUrlPage(clamped);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [totalPages, syncUrlPage]
  );

  // Handle items per page change
  const handleItemsPerPageChange = useCallback(
    (newItemsPerPage: number) => {
      setItemsPerPage(newItemsPerPage);
      setCurrentPage(1);
      syncUrlPage(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [syncUrlPage]
  );

  // Sync initial URL param on mount
  useEffect(() => {
    syncUrlPage(currentPage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white">
            Puzzles
          </h1>
          <p className="mt-2 text-slate-400">
            Challenge yourself with logic, coding, and blockchain puzzles.
          </p>
          {!isLoading && puzzles.length > 0 && (
            <p className="mt-1 text-sm text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, puzzles.length)} of{" "}
              {puzzles.length} puzzles
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && <PuzzleSkeleton />}

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
            <div className="mb-4 text-6xl">⚠️</div>
            <h2 className="mb-2 text-2xl font-bold text-slate-200">
              Something went wrong
            </h2>
            <p className="max-w-md text-slate-400">
              We couldn&apos;t load the puzzles. Please try again later.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && puzzles.length === 0 && <EmptyState />}

        {/* Puzzle Grid */}
        {!isLoading && !isError && puzzles.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginatedPuzzles.map((puzzle) => (
                <PuzzleCard key={puzzle.id} puzzle={puzzle} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 rounded-xl border border-slate-800 bg-slate-900/40 px-6 py-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function PuzzlesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"><div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"><PuzzleSkeleton /></div></div>}>
      <PuzzlesContent />
    </Suspense>
  );
}