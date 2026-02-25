// frontend/hooks/useCategories.ts
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../lib/api/categoryApi';
import type { Category } from '../lib/types/puzzles';

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000, // categories rarely change — cache for 5 min
  });
}
