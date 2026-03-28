export type PuzzleDifficulty =
  | 'ALL'
  | 'BEGINNER'
  | 'INTERMEDIATE'
  | 'ADVANCED'
  | 'EXPERT';

export interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
}

export interface Puzzle {
  id: string;
  title: string;
  description: string;
  type: 'logic' | 'coding' | 'blockchain';
  difficulty: PuzzleDifficulty;
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
  categoryId: string; // '' means "All"
  difficulty: PuzzleDifficulty;
}
