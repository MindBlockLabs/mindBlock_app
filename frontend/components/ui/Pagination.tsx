"use client";

import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50];

/**
 * Generates an array of page numbers and ellipsis markers.
 * Shows first page, last page, current page, and neighbors — with "..." for gaps.
 */
function getPageNumbers(
  currentPage: number,
  totalPages: number
): (number | "ellipsis-start" | "ellipsis-end")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];

  // Always show page 1
  pages.push(1);

  if (currentPage > 3) {
    pages.push("ellipsis-start");
  }

  // Pages around current
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push("ellipsis-end");
  }

  // Always show last page
  pages.push(totalPages);

  return pages;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange,
}: PaginationProps) {
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  if (totalPages <= 0) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between"
    >
      {/* Items per page selector */}
      {onItemsPerPageChange && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <label htmlFor="items-per-page" className="whitespace-nowrap">
            Items per page:
          </label>
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          >
            {ITEMS_PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Page navigation */}
      <div className="flex items-center gap-1.5">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Go to previous page"
          className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
            currentPage <= 1
              ? "cursor-not-allowed text-slate-600"
              : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
              clipRule="evenodd"
            />
          </svg>
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Page number buttons */}
        {pageNumbers.map((page, index) => {
          if (page === "ellipsis-start" || page === "ellipsis-end") {
            return (
              <span
                key={page}
                className="flex h-9 w-9 items-center justify-center text-sm text-slate-500"
                aria-hidden="true"
              >
                ···
              </span>
            );
          }

          const isActive = page === currentPage;

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              aria-current={isActive ? "page" : undefined}
              aria-label={`Go to page ${page}`}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "border border-slate-700 bg-transparent text-slate-300 hover:border-blue-500/50 hover:bg-slate-700/60 hover:text-white"
              }`}
            >
              {page}
            </button>
          );
        })}

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Go to next page"
          className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
            currentPage >= totalPages
              ? "cursor-not-allowed text-slate-600"
              : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
}
