export interface RewardEligibilityInput {
  score: number;
  xp: number;
  correct: boolean;
}

export interface RewardEligibilityResult {
  eligible: boolean;
  reason: string;
}