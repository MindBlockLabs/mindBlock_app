export enum PuzzleDifficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

// Helper function to get points based on difficulty
export function getPointsByDifficulty(difficulty: PuzzleDifficulty): number {
  const pointsMap: Record<PuzzleDifficulty, number> = {
    [PuzzleDifficulty.BEGINNER]: 100,
    [PuzzleDifficulty.INTERMEDIATE]: 250,
    [PuzzleDifficulty.ADVANCED]: 500,
    [PuzzleDifficulty.EXPERT]: 1000,
  };
  return pointsMap[difficulty];
}
