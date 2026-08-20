/**
 * Canonical Domain Enums for Mind Block
 */

export enum CanonicalUserRole {
  USER = 'user',
  ADMIN = 'admin',
  CREATOR = 'creator',
  SUPERADMIN = 'superadmin',
}

export enum CanonicalUserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

export enum CanonicalChallengeDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export enum CanonicalGameMode {
  STANDARD = 'standard',
  DAILY_QUEST = 'daily_quest',
  PRACTICE = 'practice',
  ASSESSMENT = 'assessment',
  SPEEDRUN = 'speedrun',
  MULTIPLAYER = 'multiplayer',
  ADAPTIVE = 'adaptive',
}

export enum CanonicalSessionStatus {
  INITIALIZED = 'initialized',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
  EXPIRED = 'expired',
}

export enum CanonicalAttemptStatus {
  STARTED = 'started',
  SUBMITTED = 'submitted',
  CORRECT = 'correct',
  INCORRECT = 'incorrect',
  EXPIRED = 'expired',
}

export enum CanonicalAchievementCategory {
  STREAK = 'streak',
  MASTERY = 'mastery',
  SPEED = 'speed',
  SPECIAL = 'special',
  COMMUNITY = 'community',
}

export enum CanonicalRewardType {
  TOKEN = 'token',
  STELLAR_NFT = 'stellar_nft',
  BADGE = 'badge',
  STREAK_FREEZE = 'streak_freeze',
  COSMETIC = 'cosmetic',
}

export enum CanonicalRewardStatus {
  PENDING = 'pending',
  CLAIMED = 'claimed',
  MINTED = 'minted',
  FAILED = 'failed',
}

export enum CanonicalLeaderboardTimeframe {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  ALL_TIME = 'all_time',
  SEASONAL = 'seasonal',
}
