export interface Puzzle {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface DailyQuest {
  id: string;
  questDate: string;
  totalQuestions: number;
  completedQuestions: number;
  isCompleted: boolean;
  pointsEarned: number;
  puzzles: Puzzle[];
}

export interface DailyQuestStatus {
  totalQuestions: number;
  completedQuestions: number;
  isCompleted: boolean;
  progressPercentage: number;
}
