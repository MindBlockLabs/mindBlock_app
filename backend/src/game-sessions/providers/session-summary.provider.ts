import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ChallengeAttempt } from '../../challenge-attempt/entities/challenge-attempt.entity';
import { AttemptStatus } from '../../challenge-attempt/enums/attempt-status.enum';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { StreaksService } from '../../streak/providers/streaks.service';
import { RewardService } from '../../rewards/providers/reward.service';
import {
  CategoryPerformanceEntry,
  SessionCompletionStats,
} from '../interfaces/game-session.interface';

/** Attempt statuses that count as "completed" for session statistics. */
const COMPLETED_ATTEMPT_STATUSES = new Set<AttemptStatus>([
  AttemptStatus.CORRECT,
  AttemptStatus.INCORRECT,
  AttemptStatus.EXPIRED,
]);

/**
 * XP conversion ratio applied to the aggregated session score.
 * No XP formula exists elsewhere in the codebase yet; this 1:1 ratio is a
 * documented placeholder that can be tuned without touching call sites.
 */
const XP_PER_SCORE_POINT = 1;

/** Default timezone used for streak calculation when the caller doesn't supply one. */
const DEFAULT_STREAK_TIMEZONE = 'UTC';

@Injectable()
export class SessionSummaryProvider {
  constructor(
    @InjectRepository(ChallengeAttempt)
    private readonly attemptRepository: Repository<ChallengeAttempt>,
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    private readonly streaksService: StreaksService,
    private readonly rewardService: RewardService,
  ) {}

  /**
   * Builds the final completion statistics for a session.
   *
   * All numeric results (score, xp, accuracy, category breakdown) are
   * derived from persisted ChallengeAttempt rows, not from client input.
   * Streak updates are only applied for authenticated users (guests have
   * no userId and therefore no streak).
   */
  async buildCompletionStats(
    sessionId: string,
    userId: string | null,
    userTimezone: string = DEFAULT_STREAK_TIMEZONE,
  ): Promise<SessionCompletionStats> {
    const attempts = await this.attemptRepository.find({
      where: { sessionId },
      order: { startedAt: 'ASC' },
    });

    const completedAttempts = attempts.filter((attempt) =>
      COMPLETED_ATTEMPT_STATUSES.has(attempt.status),
    );

    const totalScore = completedAttempts.reduce(
      (sum, attempt) => sum + (attempt.score ?? 0),
      0,
    );
    const timeSpentSeconds = completedAttempts.reduce(
      (sum, attempt) => sum + (attempt.timeSpent ?? 0),
      0,
    );
    const correctCount = completedAttempts.filter(
      (attempt) => attempt.status === AttemptStatus.CORRECT,
    ).length;
    const challengesCompleted = completedAttempts.length;
    const accuracy =
      challengesCompleted > 0
        ? Math.round((correctCount / challengesCompleted) * 100)
        : 0;
    const xpEarned = totalScore * XP_PER_SCORE_POINT;

    const categoryPerformance = await this.buildCategoryPerformance(
      completedAttempts,
    );

    const { previousStreak, currentStreak } = await this.applyStreakUpdate(
      userId,
      userTimezone,
      challengesCompleted,
    );

    const rewardResult = this.rewardService.checkEligibility({
      score: totalScore,
      xp: xpEarned,
      correct: correctCount > 0,
    });

    return {
      totalScore,
      xpEarned,
      challengesCompleted,
      accuracy,
      timeSpentSeconds,
      categoryPerformance,
      previousStreak,
      currentStreak,
      rewardEligible: rewardResult.eligible,
      rewardReason: rewardResult.reason,
    };
  }

  /**
   * Groups completed attempts by puzzle category and computes a
   * correct/total/accuracy breakdown per category.
   */
  private async buildCategoryPerformance(
    completedAttempts: ChallengeAttempt[],
  ): Promise<CategoryPerformanceEntry[]> {
    if (completedAttempts.length === 0) return [];

    const challengeIds = [
      ...new Set(completedAttempts.map((attempt) => attempt.challengeId)),
    ];

    const puzzles = await this.puzzleRepository.find({
      where: { id: In(challengeIds) },
      relations: ['category'],
    });
    const puzzleById = new Map(puzzles.map((puzzle) => [puzzle.id, puzzle]));

    const byCategory = new Map<
      string,
      { categoryName: string; correct: number; total: number }
    >();

    for (const attempt of completedAttempts) {
      const puzzle = puzzleById.get(attempt.challengeId);
      const categoryId = puzzle?.categoryId ?? 'uncategorized';
      const categoryName = puzzle?.category?.name ?? 'Uncategorized';

      const entry = byCategory.get(categoryId) ?? {
        categoryName,
        correct: 0,
        total: 0,
      };
      entry.total += 1;
      if (attempt.status === AttemptStatus.CORRECT) entry.correct += 1;
      byCategory.set(categoryId, entry);
    }

    return [...byCategory.entries()].map(([categoryId, entry]) => ({
      categoryId,
      categoryName: entry.categoryName,
      correct: entry.correct,
      total: entry.total,
      accuracy: entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : 0,
    }));
  }

  /**
   * Updates the user's streak on session completion and returns the
   * before/after snapshot. Skipped for guest sessions (no userId) and for
   * sessions with no completed challenges (nothing meaningful to reward).
   */
  private async applyStreakUpdate(
    userId: string | null,
    userTimezone: string,
    challengesCompleted: number,
  ): Promise<{ previousStreak: number | null; currentStreak: number | null }> {
    if (!userId || challengesCompleted === 0) {
      return { previousStreak: null, currentStreak: null };
    }

    const streakBefore = await this.streaksService.getStreak(userId);
    const previousStreak = streakBefore?.currentStreak ?? 0;

    const streakAfter = await this.streaksService.updateStreak(
      userId,
      userTimezone,
    );

    return { previousStreak, currentStreak: streakAfter.currentStreak };
  }
}
