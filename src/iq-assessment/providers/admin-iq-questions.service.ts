import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common"
import { Repository } from "typeorm"
import { IQQuestion } from "../entities/iq-question.entity"
import { IqAttempt } from "../entities/iq-attempt.entity"
import { CreateIqQuestionDto } from "../dto/create-iq-question.dto"
import { AdminQuestionsQueryDto } from "../dto/admin-questions-query.dto"
import { AdminQuestionResponseDto, PaginatedQuestionsResponseDto } from "../dto/admin-question-response.dto"
import { InjectRepository } from "@nestjs/typeorm"

@Injectable()
export class AdminIqQuestionsService {
  private readonly logger = new Logger(AdminIqQuestionsService.name)

  constructor(
    @InjectRepository(IQQuestion) private readonly questionRepository: Repository<IQQuestion>,
    @InjectRepository(IqAttempt) private readonly attemptRepository: Repository<IqAttempt>,
  ) {}

  async findAll(query: AdminQuestionsQueryDto): Promise<PaginatedQuestionsResponseDto> {
    const { page = 1, limit = 10, search, sortBy, sortOrder } = query
    const skip = (page - 1) * limit

    let queryBuilder = this.questionRepository.createQueryBuilder("question").leftJoin("question.attempts", "attempt")

    // Add search filter
    if (search) {
      queryBuilder = queryBuilder.where(
        "LOWER(question.questionText) LIKE LOWER(:search) OR LOWER(question.explanation) LIKE LOWER(:search)",
        { search: `%${search}%` },
      )
    }

    // Add sorting
    switch (sortBy) {
      case "questionText":
        queryBuilder = queryBuilder.orderBy("question.questionText", sortOrder)
        break
      case "totalAttempts":
        queryBuilder = queryBuilder
          .addSelect("COUNT(attempt.id)", "totalAttempts")
          .groupBy("question.id")
          .orderBy("totalAttempts", sortOrder)
        break
      case "successRate":
        queryBuilder = queryBuilder
          .addSelect("COUNT(attempt.id)", "totalAttempts")
          .addSelect("COUNT(CASE WHEN attempt.isCorrect = true THEN 1 END)", "correctAttempts")
          .addSelect(
            "CASE WHEN COUNT(attempt.id) > 0 THEN (COUNT(CASE WHEN attempt.isCorrect = true THEN 1 END) * 100.0 / COUNT(attempt.id)) ELSE 0 END",
            "successRate",
          )
          .groupBy("question.id")
          .orderBy("successRate", sortOrder)
        break
      default:
        queryBuilder = queryBuilder.orderBy("question.id", sortOrder)
    }

    // Get total count
    const totalQuery = this.questionRepository.createQueryBuilder("question")
    if (search) {
      totalQuery.where(
        "LOWER(question.questionText) LIKE LOWER(:search) OR LOWER(question.explanation) LIKE LOWER(:search)",
        { search: `%${search}%` },
      )
    }
    const total = await totalQuery.getCount()

    // Get paginated results
    const questions = await queryBuilder.skip(skip).take(limit).getMany()

    // Get attempt statistics for each question
    const questionsWithStats = await Promise.all(
      questions.map(async (question) => {
        const attempts = await this.attemptRepository.find({
          where: { questionId: question.id },
        })

        const totalAttempts = attempts.length
        const correctAttempts = attempts.filter((attempt) => attempt.isCorrect).length
        const successRate = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

        return {
          id: question.id,
          questionText: question.questionText,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          totalAttempts,
          correctAttempts,
          successRate,
        } as AdminQuestionResponseDto
      }),
    )

    const totalPages = Math.ceil(total / limit)

    return {
      questions: questionsWithStats,
      total,
      page,
      limit,
      totalPages,
    }
  }

  async findOne(id: string): Promise<AdminQuestionResponseDto> {
    const question = await this.questionRepository.findOne({
      where: { id },
    })

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`)
    }

    // Get attempt statistics
    const attempts = await this.attemptRepository.find({
      where: { questionId: id },
    })

    const totalAttempts = attempts.length
    const correctAttempts = attempts.filter((attempt) => attempt.isCorrect).length
    const successRate = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0

    return {
      id: question.id,
      questionText: question.questionText,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      totalAttempts,
      correctAttempts,
      successRate,
    }
  }

  async create(createQuestionDto: CreateIqQuestionDto): Promise<AdminQuestionResponseDto> {
    // Validate that correctAnswer is one of the options
    if (!createQuestionDto.options.includes(createQuestionDto.correctAnswer)) {
      throw new BadRequestException("Correct answer must be one of the provided options")
    }

    // Check for duplicate questions
    const existingQuestion = await this.questionRepository.findOne({
      where: { questionText: createQuestionDto.questionText },
    })

    if (existingQuestion) {
      throw new BadRequestException("A question with this text already exists")
    }

    const question = this.questionRepository.create({
      questionText: createQuestionDto.questionText,
      options: createQuestionDto.options,
      correctAnswer: createQuestionDto.correctAnswer,
      explanation: createQuestionDto.explanation,
    })

    const savedQuestion = await this.questionRepository.save(question)

    this.logger.log(`Created new IQ question with ID: ${savedQuestion.id}`)

    return {
      id: savedQuestion.id,
      questionText: savedQuestion.questionText,
      options: savedQuestion.options,
      correctAnswer: savedQuestion.correctAnswer,
      explanation: savedQuestion.explanation,
      totalAttempts: 0,
      correctAttempts: 0,
      successRate: 0,
    }
  }

  async delete(id: string): Promise<void> {
    const question = await this.questionRepository.findOne({
      where: { id },
    })

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`)
    }

    // Check if question is being used in active sessions
    const activeSessionsCount = await this.questionRepository
      .createQueryBuilder("question")
      .leftJoin("iq_assessment_sessions", "session", "session.questionIds @> ARRAY[:questionId]::uuid[]")
      .where("question.id = :questionId", { questionId: id })
      .andWhere("session.completed = false")
      .setParameter("questionId", id)
      .getCount()

    if (activeSessionsCount > 0) {
      throw new BadRequestException("Cannot delete question that is being used in active assessment sessions")
    }

    await this.questionRepository.remove(question)

    this.logger.log(`Deleted IQ question with ID: ${id}`)
  }

  async getQuestionStats(): Promise<{
    totalQuestions: number
    totalAttempts: number
    averageSuccessRate: number
    questionsWithoutAttempts: number
  }> {
    const totalQuestions = await this.questionRepository.count()
    const totalAttempts = await this.attemptRepository.count()

    const questionsWithAttempts = await this.questionRepository
      .createQueryBuilder("question")
      .leftJoin("question.attempts", "attempt")
      .select("question.id")
      .addSelect("COUNT(attempt.id)", "attemptCount")
      .addSelect("COUNT(CASE WHEN attempt.isCorrect = true THEN 1 END)", "correctCount")
      .groupBy("question.id")
      .getRawMany()

    const questionsWithoutAttempts = totalQuestions - questionsWithAttempts.length

    const totalSuccessRate = questionsWithAttempts.reduce((sum, q) => {
      const successRate = q.attemptCount > 0 ? (q.correctCount / q.attemptCount) * 100 : 0
      return sum + successRate
    }, 0)

    const averageSuccessRate =
      questionsWithAttempts.length > 0 ? Math.round(totalSuccessRate / questionsWithAttempts.length) : 0

    return {
      totalQuestions,
      totalAttempts,
      averageSuccessRate,
      questionsWithoutAttempts,
    }
  }
}
