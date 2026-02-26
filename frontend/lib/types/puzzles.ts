export interface Puzzle {
  id: string;
  title: string;
  description: string;
  type: 'logic' | 'coding' | 'blockchain';
  difficulty: 'easy' | 'medium' | 'hard';
  categoryId: string;
  timeLimit?: number;
}

export interface PuzzleQueryParams {
  categoryId?: string;
  difficulty?: string;
  page?: number;
  limit?: number;
}

export interface PuzzleFilters {
  categoryId: string;
  difficulty: string;
}
