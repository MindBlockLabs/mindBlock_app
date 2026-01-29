export enum PuzzleDifficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

// Helper function to get points based on difficulty
export function getPointsByDifficulty(difficulty: PuzzleDifficulty): number {
  const pointsMap: Record<PuzzleDifficulty, number> = {
    [PuzzleDifficulty.BEGINNER]: 10,
    [PuzzleDifficulty.INTERMEDIATE]: 25,
    [PuzzleDifficulty.ADVANCED]: 50,
    [PuzzleDifficulty.EXPERT]: 100,
  };
  return pointsMap[difficulty];
}
