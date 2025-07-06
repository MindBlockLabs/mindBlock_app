export const STREAK_MILESTONES = {
  3: { xp: 50, tokens: 5, description: '3-Day Streak' },
  7: { xp: 150, tokens: 15, description: '7-Day Streak' },
  14: { xp: 300, tokens: 30, description: '14-Day Streak' },
  30: { xp: 600, tokens: 60, description: '30-Day Streak' },
  60: { xp: 1200, tokens: 120, description: '60-Day Streak' },
  100: { xp: 2000, tokens: 200, description: '100-Day Streak' },
} as const;

export const STREAK_EVENTS = {
  PUZZLE_SOLVED: 'streak.puzzle.solved',
  MILESTONE_REACHED: 'streak.milestone.reached',
} as const;

export const STREAK_CONFIG = {
  MAX_STREAK_MILESTONE: 100,
  BASE_XP_PER_PUZZLE: 10,
  BASE_TOKENS_PER_PUZZLE: 1,
} as const; 