// frontend/hooks/usePuzzles.ts
import { useQuery } from '@tanstack/react-query';
import {
  getPuzzles,
  getPuzzleById,
  getDailyQuestPuzzles,
} from '../lib/api/puzzleApi';
import { PuzzleQueryParams, Puzzle } from '../lib/types/puzzles';

export function usePuzzles(query: PuzzleQueryParams) {
  return useQuery<Puzzle[]>({
    queryKey: ['puzzles', query],
    queryFn: () => getPuzzles(query),
  });
}

export function usePuzzle(id: string) {
  return useQuery<Puzzle>({
    queryKey: ['puzzle', id],
    queryFn: () => getPuzzleById(id),
    enabled: !!id,
  });
}

export function useDailyQuestPuzzles() {
  return useQuery<Puzzle[]>({
    queryKey: ['dailyQuestPuzzles'],
    queryFn: getDailyQuestPuzzles,
  });
}
