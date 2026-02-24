'use client';

import React from 'react';
import { useCategories } from '@/hooks/useCategories';

interface CategoryFilterProps {
  selectedCategoryId: string; // '' means "All"
  onChange: (categoryId: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategoryId,
  onChange,
}) => {
  const { data: categories, isLoading, isError } = useCategories();

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="category-filter"
        className="text-xs font-semibold uppercase tracking-widest text-slate-400"
      >
        Category
      </label>

      <div className="relative">
        <select
          id="category-filter"
          value={selectedCategoryId}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading || isError}
          className={`
            w-full h-10 pl-3 pr-8 rounded-lg text-sm font-medium
            bg-[#050C16] border border-white/10 text-white
            appearance-none cursor-pointer
            transition-all duration-200
            focus:outline-none focus:ring-1 focus:ring-[#3B82F6] focus:border-[#3B82F6]
            hover:border-white/25
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <option value="">
            {isLoading ? 'Loading…' : isError ? 'Failed to load' : 'All Categories'}
          </option>

          {!isLoading && !isError && categories?.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon ? `${cat.icon} ` : ''}{cat.name}
            </option>
          ))}
        </select>

        {/* Custom chevron icon */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M3 5L7 9L11 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      {isError && (
        <p className="text-xs text-red-400 mt-0.5">
          Could not load categories. Please refresh.
        </p>
      )}
    </div>
  );
};

export default CategoryFilter;
