export interface ScoreCalculationInput {
  correct: boolean;
  basePoints: number;
  attempts?: number;
  timeTakenSeconds?: number;
}

export interface ScoreCalculationResult {
  score: number;
  correct: boolean;
}