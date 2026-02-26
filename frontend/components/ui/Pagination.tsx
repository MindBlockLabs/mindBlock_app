'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50];

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Generate page numbers to display with ellipsis
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    
    // Always show first page
    pages.push(1);
    
    if (currentPage <= 4) {
      // Show pages 2-5 when current is near start
      for (let i = 2; i <= 5; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      // Show ellipsis and last 4 pages when current is near end
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show ellipsis on both sides with current page in middle
      pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    }
    
    return pages;
  }, [currentPage, totalPages]);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    onPageChange(page);
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      {/* Page Navigation */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={`
            flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
            ${currentPage === 1
              ? 'text-slate-500 border-slate-700 cursor-not-allowed'
              : 'text-slate-300 border-slate-600 hover:border-[#3B82F6]/40 hover:text-white hover:bg-white/[0.05]'
            }
          `}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-slate-500">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => handlePageClick(page as number)}
                className={`
                  px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
                  ${currentPage === page
                    ? 'bg-[#3B82F6] text-white border-[#3B82F6]'
                    : 'text-slate-300 border-slate-600 hover:border-[#3B82F6]/40 hover:text-white hover:bg-white/[0.05]'
                  }
                `}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            )
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`
            flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
            ${currentPage === totalPages
              ? 'text-slate-500 border-slate-700 cursor-not-allowed'
              : 'text-slate-300 border-slate-600 hover:border-[#3B82F6]/40 hover:text-white hover:bg-white/[0.05]'
            }
          `}
          aria-label="Next page"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Items per page selector */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span>Items per page:</span>
        <select
          value={ITEMS_PER_PAGE_OPTIONS[0]} // This will be handled by parent component
          onChange={(e) => {
            // This will be handled by parent component
            const newItemsPerPage = parseInt(e.target.value);
            // Trigger page change with items per page info
            onPageChange(currentPage); // Parent will handle items per page change
          }}
          className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-[#3B82F6]/40"
        >
          {ITEMS_PER_PAGE_OPTIONS.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Pagination;
