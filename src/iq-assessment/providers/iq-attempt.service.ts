import { Injectable, NotFoundException, Logger } from "@nestjs/common"
import { Repository } from "typeorm"
import { IqAttempt } from "../entities/iq-attempt.entity"
import { IQQuestion } from "../entities/iq-question.entity"
import { User } from "../../users/user.entity"
import { CreateAttemptDto } from "../dto/create-attempt.dto"
import { AttemptResponseDto, UserAttemptsStatsDto } from "../dto/attempt-response.dto"
import { InjectRepository } from "@nestjs/typeorm"

@Injectable()
export class IqAttemptService {
  private readonly logger = new Logger(IqAttemptService.name)

  constructor(
    @InjectRepository(IQQuestion)
    private readonly questionRepository: Repository<IQQuestion>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @InjectRepository(IqAttempt)
  private readonly attemptRepository: Repository<IqAttempt>;

  /**
   * Create a new attempt record
   */
  async create(createAttemptDto: CreateAttemptDto): Promise<AttemptResponseDto> {
    // Verify question exists
    const question = await this.questionRepository.findOne({
      where: { id: createAttemptDto.questionId },
    })

    if (!question) {
      throw new NotFoundException("Question not found")
    }

    // Verify user exists if userId is provided
    let user: User | null = null
    if (createAttemptDto.userId) {
      user = await this.userRepository.findOne({
        where: { id: createAttemptDto.userId },
      })

      if (!user) {
        throw new NotFoundException("User not found")
      }
    }

    // Create the attempt
    const attempt = this.attemptRepository.create({
      userId: createAttemptDto.userId,
      user,
      questionId: createAttemptDto.questionId,
      question,
      selectedAnswer: createAttemptDto.selectedAnswer,
      correctAnswer: createAttemptDto.correctAnswer,
      isCorrect: createAttemptDto.isCorrect,
    })

    const savedAttempt = await this.attemptRepository.save(attempt)

    this.logger.log(
      `Created attempt ${savedAttempt.id} for question ${createAttemptDto.questionId} by user ${createAttemptDto.userId || "anonymous"}`,
    )

    return this.mapToResponseDto(savedAttempt)
  }

  /**
   * Find all attempts by user ID
   */
  async findAllByUser(userId: string): Promise<AttemptResponseDto[]> {
    const attempts = await this.attemptRepository.find({
      where: { userId },
      relations: ["question"],
      order: { createdAt: "DESC" },
    })

    return attempts.map((attempt) => this.mapToResponseDto(attempt))
  }

  /**
   * Find all attempts for a specific question
   */
  async findAllByQuestion(questionId: string): Promise<AttemptResponseDto[]> {
    const attempts = await this.attemptRepository.find({
      where: { questionId },
      relations: ["question", "user"],
      order: { createdAt: "DESC" },
    })

    return attempts.map((attempt) => this.mapToResponseDto(attempt))
  }

  /**
   * Get user attempt statistics
   */
  async getUserStats(userId: string): Promise<UserAttemptsStatsDto> {
    const attempts = await this.attemptRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    })

    const totalAttempts = attempts.length
    const correctAttempts = attempts.filter((attempt) => attempt.isCorrect).length
    const incorrectAttempts = totalAttempts - correctAttempts
    const accuracyPercentage = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0
    const lastAttemptDate = attempts.length > 0 ? attempts[0].createdAt : undefined

    return {
      totalAttempts,
      correctAttempts,
      incorrectAttempts,
      accuracyPercentage,
      lastAttemptDate,
    }
  }

  /**
   * Get recent attempts (for analytics)
   */
  async getRecentAttempts(limit = 100): Promise<AttemptResponseDto[]> {
    const attempts = await this.attemptRepository.find({
      relations: ["question", "user"],
      order: { createdAt: "DESC" },
      take: limit,
    })

    return attempts.map((attempt) => this.mapToResponseDto(attempt))
  }

  /**
   * Get attempts by date range
   */
  async getAttemptsByDateRange(startDate: Date, endDate: Date, userId?: string): Promise<AttemptResponseDto[]> {
    const queryBuilder = this.attemptRepository
      .createQueryBuilder("attempt")
      .leftJoinAndSelect("attempt.question", "question")
      .leftJoinAndSelect("attempt.user", "user")
      .where("attempt.createdAt >= :startDate", { startDate })
      .andWhere("attempt.createdAt <= :endDate", { endDate })

    if (userId) {
      queryBuilder.andWhere("attempt.userId = :userId", { userId })
    }

    const attempts = await queryBuilder.orderBy("attempt.createdAt", "DESC").getMany()

    return attempts.map((attempt) => this.mapToResponseDto(attempt))
  }

  /**
   * Get global statistics
   */
  async getGlobalStats(): Promise<{
    totalAttempts: number
    totalCorrect: number
    totalIncorrect: number
    globalAccuracy: number
    uniqueUsers: number
    anonymousAttempts: number
  }> {
    const totalAttempts = await this.attemptRepository.count()
    const totalCorrect = await this.attemptRepository.count({
      where: { isCorrect: true },
    })
    const totalIncorrect = totalAttempts - totalCorrect
    const globalAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0

    const uniqueUsersResult = await this.attemptRepository
      .createQueryBuilder("attempt")
      .select("COUNT(DISTINCT attempt.userId)", "count")
      .where("attempt.userId IS NOT NULL")
      .getRawOne()

    const uniqueUsers = Number.parseInt(uniqueUsersResult?.count || "0")

    const anonymousAttempts = await this.attemptRepository.count({
      where: { userId: require("typeorm").IsNull() },
    })

    return {
      totalAttempts,
      totalCorrect,
      totalIncorrect,
      globalAccuracy,
      uniqueUsers,
      anonymousAttempts,
    }
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(attempt: IqAttempt): AttemptResponseDto {
    return {
      id: attempt.id,
      userId: attempt.userId,
      questionId: attempt.questionId,
      selectedAnswer: attempt.selectedAnswer,
      correctAnswer: attempt.correctAnswer,
      isCorrect: attempt.isCorrect,
      createdAt: attempt.createdAt,
      questionText: attempt.question?.questionText,
    }
  }
}
