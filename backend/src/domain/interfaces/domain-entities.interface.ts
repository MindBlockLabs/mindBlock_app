import {
  CanonicalUserRole,
  CanonicalUserStatus,
  CanonicalChallengeDifficulty,
  CanonicalGameMode,
  CanonicalSessionStatus,
  CanonicalAttemptStatus,
  CanonicalAchievementCategory,
  CanonicalRewardType,
  CanonicalRewardStatus,
  CanonicalLeaderboardTimeframe,
} from '../enums/domain.enums';

/**
 * 1. User (Identity & Authentication Root)
 */
export interface IUser {
  id: string;
  email?: string;
  passwordHash?: string;
  googleId?: string;
  stellarWallet?: string;
  role: CanonicalUserRole;
  status: CanonicalUserStatus;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 2. PlayerProfile (Personalization & Preferences)
 */
export interface IPlayerProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  country?: string;
  timezone: string;
  defaultDifficulty: CanonicalChallengeDifficulty;
  preferredCategories?: string[];
  ageGroup?: string;
  occupation?: string;
  goals?: string[];
  availableHours?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 3. GameSession (Gameplay Context & Temporal Lifecycle)
 */
export interface IGameSession {
  id: string;
  userId: string;
  gameMode: CanonicalGameMode;
  status: CanonicalSessionStatus;
  targetChallengeCount: number;
  completedChallengeCount: number;
  totalScore: number;
  totalTimeSpent: number;
  metadata?: Record<string, any>;
  startedAt: Date;
  endedAt?: Date;
  expiresAt?: Date;
}

/**
 * 4. Challenge (Playable Content Unit - Canonical name for Puzzle)
 */
export interface IChallenge {
  id: string;
  categoryId: string;
  difficulty: CanonicalChallengeDifficulty;
  title?: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  hints?: string[];
  points: number;
  timeLimit: number;
  isActive: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 5. ChallengeAttempt (Individual Interaction Instance)
 */
export interface IChallengeAttempt {
  id: string;
  userId: string;
  challengeId: string;
  sessionId?: string;
  status: CanonicalAttemptStatus;
  userAnswer?: string;
  score: number;
  timeSpent: number;
  hintsUsed: number;
  solutionRevealed: boolean;
  startedAt: Date;
  submittedAt?: Date;
}

/**
 * 6. PlayerProgress (Mastery & Historical Completion Ledger)
 */
export interface IPlayerProgress {
  id: string;
  userId: string;
  challengeId: string;
  categoryId: string;
  attemptId?: string;
  isMastered: boolean;
  totalAttempts: number;
  bestScore: number;
  firstCompletedAt: Date;
  lastAttemptedAt: Date;
}

/**
 * 7. PlayerStats (Aggregated Performance Metrics)
 */
export interface IPlayerStats {
  id: string;
  userId: string;
  totalXp: number;
  currentLevel: number;
  challengesSolved: number;
  accuracyRate: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
  averageSolveTime: number;
  tokensBalance: number;
  updatedAt: Date;
}

/**
 * 8. Achievement & UserAchievement (Milestones & Badges)
 */
export interface IAchievement {
  id: string;
  slug: string;
  title: string;
  description: string;
  badgeIconUrl: string;
  category: CanonicalAchievementCategory;
  xpReward: number;
  tokenReward: number;
  isActive: boolean;
}

export interface IUserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  isClaimed: boolean;
}

/**
 * 9. Reward & UserReward (Economy & Web3 Rewards)
 */
export interface IReward {
  id: string;
  type: CanonicalRewardType;
  amount: number;
  assetCode?: string;
  name: string;
  description?: string;
}

export interface IUserReward {
  id: string;
  userId: string;
  rewardId: string;
  status: CanonicalRewardStatus;
  txHash?: string;
  claimedAt?: Date;
}

/**
 * 10. LeaderboardEntry (Competitive Rankings)
 */
export interface ILeaderboardEntry {
  id: string;
  userId: string;
  timeframe: CanonicalLeaderboardTimeframe;
  periodKey: string;
  categoryId?: string;
  score: number;
  rank: number;
  challengesCompleted: number;
  updatedAt: Date;
}
