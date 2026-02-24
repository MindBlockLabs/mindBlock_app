import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { DailyQuest } from '../entities/daily-quest.entity';
import { DailyQuestPuzzle } from '../entities/daily-quest-puzzle.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';
import { Category } from '../../categories/entities/category.entity';
import { UserProgress } from '../../progress/entities/progress.entity';
import { User } from '../../users/user.entity';
import { DailyQuestResponseDto } from '../dtos/daily-quest-response.dto';
import { PuzzleResponseDto } from '../dtos/puzzle-response.dto';
import { PuzzleDifficulty } from '../../puzzles/enums/puzzle-difficulty.enum';
import { getDateString } from 'src/shared/utils/date.util';

@Injectable()
export class GetTodaysDailyQuestProvider {
  private readonly logger = new Logger(GetTodaysDailyQuestProvider.name);

  constructor(
    @InjectRepository(DailyQuest)
    private readonly dailyQuestRepository: Repository<DailyQuest>,
    @InjectRepository(DailyQuestPuzzle)
    private readonly dailyQuestPuzzleRepository: Repository<DailyQuestPuzzle>,
    @InjectRepository(Puzzle)
    private readonly puzzleRepository: Repository<Puzzle>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(UserProgress)
    private readonly userProgressRepository: Repository<UserProgress>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async execute(
    userId: string,
    userTimezone: string,
  ): Promise<DailyQuestResponseDto> {
    const todayDate = getDateString(userTimezone, 0);

    this.logger.log(`Fetching daily quest for user ${userId} on ${todayDate}`);

    let dailyQuest = await this.findExistingQuest(userId, todayDate);

    if (!dailyQuest) {
      this.logger.log(
        `No quest found, generating new quest for user ${userId}`,
      );
      dailyQuest = await this.generateDailyQuest(userId, todayDate);
    }

    return this.buildQuestResponse(dailyQuest);
  }

  private async findExistingQuest(
    userId: string,
    questDate: string,
  ): Promise<DailyQuest | null> {
    return this.dailyQuestRepository.findOne({
      where: { userId: userId, questDate },
      relations: ['questPuzzles', 'questPuzzles.puzzle'],
    });
  }

  private async generateDailyQuest(
    userId: string,
    questDate: string,
  ): Promise<DailyQuest> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const userDifficulty = this.mapChallengeLevel(user.challengeLevel);

    const activeCategories = await this.categoryRepository.find({
      where: { isActive: true },
    });

    if (activeCategories.length === 0) {
      throw new Error('No active categories available for quest generation');
    }

    const activeCategoryIds = activeCategories.map((cat) => cat.id.toString());

    const selectedPuzzles = await this.selectRandomPuzzles(
      userDifficulty,
      activeCategoryIds,
      10,
    );

    if (selectedPuzzles.length < 10) {
      this.logger.warn(
        `Only found ${selectedPuzzles.length} puzzles matching criteria for user ${userId}`,
      );
    }

    const dailyQuest = this.dailyQuestRepository.create({
      userId: userId,
      questDate,
      totalQuestions: selectedPuzzles.length,
      completedQuestions: 0,
      isCompleted: false,
      pointsEarned: 0,
    });

    const savedQuest = await this.dailyQuestRepository.save(dailyQuest);

    const questPuzzles = selectedPuzzles.map((puzzle, index) =>
      this.dailyQuestPuzzleRepository.create({
        dailyQuestId: savedQuest.id,
        puzzleId: puzzle.id,
        orderIndex: index,
      }),
    );

    await this.dailyQuestPuzzleRepository.save(questPuzzles);

    const questWithRelations = await this.dailyQuestRepository.findOne({
      where: { id: savedQuest.id },
      relations: ['questPuzzles', 'questPuzzles.puzzle'],
    });

    if (!questWithRelations) {
      throw new Error(
        `Failed to retrieve created daily quest ${savedQuest.id}`,
      );
    }

    return questWithRelations;
  }

  private mapChallengeLevel(
    challengeLevel: string | undefined,
  ): PuzzleDifficulty {
    const mapping: Record<string, PuzzleDifficulty> = {
      beginner: PuzzleDifficulty.BEGINNER,
      intermediate: PuzzleDifficulty.INTERMEDIATE,
      advanced: PuzzleDifficulty.ADVANCED,
      expert: PuzzleDifficulty.EXPERT,
    };

    return (
      mapping[challengeLevel?.toLowerCase() || 'beginner'] ||
      PuzzleDifficulty.BEGINNER
    );
  }

  private async selectRandomPuzzles(
    difficulty: PuzzleDifficulty,
    categoryIds: string[],
    count: number,
  ): Promise<Puzzle[]> {
    const where: FindOptionsWhere<Puzzle> = {
      difficulty,
      categoryId: In(categoryIds),
    };

    const puzzles = await this.puzzleRepository.find({
      where,
    });

    // Fisher-Yates shuffle for randomized order similar to ORDER BY RANDOM()
    for (let i = puzzles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [puzzles[i], puzzles[j]] = [puzzles[j], puzzles[i]];
    }

    return puzzles.slice(0, count);
  }

  private async buildQuestResponse(
    dailyQuest: DailyQuest,
  ): Promise<DailyQuestResponseDto> {
    const completedPuzzleIds = await this.getCompletedPuzzleIds(dailyQuest.id);

    const puzzlesWithStatus: PuzzleResponseDto[] = dailyQuest.questPuzzles
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((qp) => ({
        id: qp.puzzle.id,
        question: qp.puzzle.question,
        options: qp.puzzle.options,
        difficulty: qp.puzzle.difficulty,
        categoryId: qp.puzzle.categoryId,
        points: qp.puzzle.points,
        timeLimit: qp.puzzle.timeLimit,
        isCompleted: completedPuzzleIds.has(qp.puzzle.id),
      }));

    return {
      id: dailyQuest.id,
      questDate: dailyQuest.questDate,
      totalQuestions: dailyQuest.totalQuestions,
      completedQuestions: dailyQuest.completedQuestions,
      isCompleted: dailyQuest.isCompleted,
      pointsEarned: dailyQuest.pointsEarned,
      createdAt: dailyQuest.createdAt,
      completedAt: dailyQuest.completedAt,
      puzzles: puzzlesWithStatus,
    };
  }

  private async getCompletedPuzzleIds(
    dailyQuestId: number,
  ): Promise<Set<string>> {
    const completedProgress = await this.userProgressRepository.find({
      where: { dailyQuestId },
      select: ['puzzleId'],
    });

    return new Set(completedProgress.map((p) => p.puzzleId.toString()));
  }
}
