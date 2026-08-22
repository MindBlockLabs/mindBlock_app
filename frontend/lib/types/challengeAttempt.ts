export type AttemptStatus =
  | 'STARTED'
  | 'SUBMITTED'
  | 'CORRECT'
  | 'INCORRECT'
  | 'EXPIRED';

export interface ChallengeAttempt {
  id: string;
  sessionId?: string;
  userId: string;
  challengeId: string;
  answer?: string;
  status: AttemptStatus;
  score: number;
  timeSpent: number;
  hintsUsed: number;
  solutionRevealed: boolean;
  startedAt: string;
  submittedAt?: string;
  nextChallengeId?: string;
  sessionCompleted: boolean;
}

/** Minimal puzzle shape returned inline with a submit result, matching backend PuzzleSummaryDto. */
export interface PuzzleSummary {
  id: string;
  question: string;
  options: string[];
  difficulty: string;
  points: number;
  timeLimit: number;
  categoryId: string;
}

export interface XpResult {
  awarded: number;
  levelUp: boolean;
  currentLevel: number;
  currentXp: number;
}

export interface SessionProgress {
  attemptsInSession: number;
  sessionTarget: number;
  sessionCompleted: boolean;
}

export interface SubmitAttemptResult {
  attempt: ChallengeAttempt;
  isCorrect: boolean;
  feedback: string;
  xp: XpResult | null;
  progress: SessionProgress;
  nextChallenge: PuzzleSummary | null;
  isDuplicateReplay: boolean;
}
