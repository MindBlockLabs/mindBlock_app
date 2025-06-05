export interface StreakMilestone {
  day: number;
  bonusXp: number;
  bonusTokens: number;
  title: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  {
    day: 3,
    bonusXp: 50,
    bonusTokens: 5,
    title: '3-Day Streak'
  },
  {
    day: 7,
    bonusXp: 150,
    bonusTokens: 15,
    title: 'Weekly Warrior'
  },
  {
    day: 14,
    bonusXp: 350,
    bonusTokens: 35,
    title: 'Two Week Champion'
  },
  {
    day: 30,
    bonusXp: 800,
    bonusTokens: 80,
    title: 'Monthly Master'
  },
  {
    day: 50,
    bonusXp: 1500,
    bonusTokens: 150,
    title: 'Dedication Legend'
  },
  {
    day: 100,
    bonusXp: 3000,
    bonusTokens: 300,
    title: 'Century Solver'
  }
];

export const getMilestoneReward = (streakDay: number): StreakMilestone | null => {
  return STREAK_MILESTONES.find(milestone => milestone.day === streakDay) || null;
};