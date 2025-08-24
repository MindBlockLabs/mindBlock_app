import { Injectable, NotFoundException, Logger } from "@nestjs/common"
import { Repository, Between } from "typeorm"
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
    @InjectRepository(IqAttempt) private readonly attemptRepository: Repository<IqAttempt>,
    @InjectRepository(IQQuestion) private readonly questionRepository: Repository<IQQuestion>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async create(createAttemptDto: CreateAttemptDto): Promise<AttemptResponseDto> {
    // Verify question exists
    const question = await this.questionRepository.findOne({
      where: { id: createAttemptDto.questionId },
    })

    if (!question) {
      throw new NotFoundException("Question not found")
    }

    // Verify user exists (if userId provided)
    let user: User | undefined
    if (createAttemptDto.userId) {
      const foundUser = await this.userRepository.findOne({
        where: { id: createAttemptDto.userId },
      })
      user = foundUser === null ? undefined : foundUser

      if (!user) {
        throw new NotFoundException("User not found")
      }
    }

    const attempt = this.attemptRepository.create({
      userId: createAttemptDto.userId,
      questionId: createAttemptDto.questionId,
      selectedAnswer: createAttemptDto.selectedAnswer,
      correctAnswer: createAttemptDto.correctAnswer,
      isCorrect: createAttemptDto.isCorrect,
      user,
      question,
    })

    const savedAttempt = await this.attemptRepository.save(attempt)

    this.logger.log(
      `Created attempt ${savedAttempt.id} for question ${createAttemptDto.questionId} by user ${createAttemptDto.userId || "anonymous"}`,
    )

    return this.mapToResponseDto(savedAttempt)
  }

  async findAllByUser(userId: string): Promise<AttemptResponseDto[]> {
    const attempts = await this.attemptRepository.find({
      where: { userId },
      relations: ["question"],
      order: { createdAt: "DESC" },
    })

    return attempts.map((attempt) => this.mapToResponseDto(attempt))
  }

  async findAllByQuestion(questionId: string): Promise<AttemptResponseDto[]> {
    const attempts = await this.attemptRepository.find({
      where: { questionId },
      relations: ["user", "question"],
      order: { createdAt: "DESC" },
    })

    return attempts.map((attempt) => this.mapToResponseDto(attempt))
  }

  async getUserStats(userId: string): Promise<UserAttemptsStatsDto> {
    const attempts = await this.attemptRepository.find({
      where: { userId },
    })

    const totalAttempts = attempts.length
    const correctAttempts = attempts.filter((attempt) => attempt.isCorrect).length
    const incorrectAttempts = totalAttempts - correctAttempts
    const accuracyPercentage = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0
    const lastAttemptDate = attempts.length > 0 ? attempts[0].createdAt : undefined

    return {
      userId,
      totalAttempts,
      correctAttempts,
      incorrectAttempts,
      accuracyPercentage,
      lastAttemptDate,
    }
  }

  async getRecentAttempts(limit = 100): Promise<AttemptResponseDto[]> {
    const attempts = await this.attemptRepository.find({
      relations: ["user", "question"],
      order: { createdAt: "DESC" },
      take: limit,
    })

    return attempts.map((attempt) => this.mapToResponseDto(attempt))
  }

  async getGlobalStats(): Promise<{
    totalAttempts: number
    totalCorrectAttempts: number
    totalIncorrectAttempts: number
    globalAccuracyPercentage: number
    uniqueUsers: number
    uniqueQuestions: number
  }> {
    const totalAttempts = await this.attemptRepository.count()
    const totalCorrectAttempts = await this.attemptRepository.count({
      where: { isCorrect: true },
    })
    const totalIncorrectAttempts = totalAttempts - totalCorrectAttempts
    const globalAccuracyPercentage = totalAttempts > 0 ? Math.round((totalCorrectAttempts / totalAttempts) * 100) : 0

    const uniqueUsers = await this.attemptRepository
      .createQueryBuilder("attempt")
      .select("COUNT(DISTINCT attempt.userId)", "count")
      .where("attempt.userId IS NOT NULL")
      .getRawOne()
      .then((result) => Number.parseInt(result.count) || 0)

    const uniqueQuestions = await this.attemptRepository
      .createQueryBuilder("attempt")
      .select("COUNT(DISTINCT attempt.questionId)", "count")
      .getRawOne()
      .then((result) => Number.parseInt(result.count) || 0)

    return {
      totalAttempts,
      totalCorrectAttempts,
      totalIncorrectAttempts,
      globalAccuracyPercentage,
      uniqueUsers,
      uniqueQuestions,
    }
  }

  async getAttemptsByDateRange(startDate: Date, endDate: Date, userId?: string): Promise<AttemptResponseDto[]> {
    const whereCondition: any = {
      createdAt: Between(startDate, endDate),
    }

    if (userId) {
      whereCondition.userId = userId
    }

    const attempts = await this.attemptRepository.find({
      where: whereCondition,
      relations: ["user", "question"],
      order: { createdAt: "DESC" },
    })

    return attempts.map((attempt) => this.mapToResponseDto(attempt))
  }

  private mapToResponseDto(attempt: IqAttempt): AttemptResponseDto {
    return {
      id: attempt.id,
      userId: attempt.userId,
      questionId: attempt.questionId,
      questionText: attempt.question?.questionText,
      selectedAnswer: attempt.selectedAnswer,
      correctAnswer: attempt.correctAnswer,
      isCorrect: attempt.isCorrect,
      createdAt: attempt.createdAt,
      userName:
        attempt.user?.username
          ? attempt.user.username
          : undefined,
    }
  }
}
