import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IQAssessmentSession } from '../entities/iq-assessment-session.entity';
import {
  IQQuestion,
  QuestionDifficulty,
  QuestionCategory,
} from '../entities/iq-question.entity';
import { IQAnswer } from '../entities/iq-answer.entity';
import { User } from '../../users/user.entity';
import { CreateSessionDto } from '../dto/create-session.dto';
import {
  SubmitAnswerDto,
  StandaloneSubmitAnswerDto,
} from '../dto/submit-answer.dto';
import {
  SessionResponseDto,
  CompletedSessionResponseDto,
} from '../dto/session-response.dto';
import { AnswerSubmissionResponseDto } from '../dto/answer-submission-response.dto';
import { RandomQuestionsQueryDto } from '../dto/random-questions-query.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { IqAttemptService } from './iq-attempt.service';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateAttemptDto } from '../dto/create-attempt.dto';
import { SubmitQuizDto } from '../dto/submit-quiz.dto';
import { StartQuizDto } from '../dto/start-quiz.dto';
import { AchievementService } from '../../achievement/providers/achievement.service';
import { ActiveUserData } from '../../auth/interfaces/activeInterface';

@Injectable()
export class IQAssessmentService {
  private readonly logger = new Logger(IQAssessmentService.name);

  constructor(
    @InjectRepository(IQAssessmentSession)
    private readonly sessionRepository: Repository<IQAssessmentSession>,
    @InjectRepository(IQQuestion)
    private readonly questionRepository: Repository<IQQuestion>,
    @InjectRepository(IQAnswer)
    private readonly answerRepository: Repository<IQAnswer>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly httpService: HttpService,
    private readonly iqAttemptService: IqAttemptService,
    private readonly eventEmitter: EventEmitter2,
    private readonly achievementService: AchievementService,
  ) {}

  public async fetchExternalQuestions(amount: number) {
    const url = `https://opentdb.com/api.php?amount=${amount}&type=multiple`;
    const res$ = this.httpService.get(url).pipe(map((resp) => resp.data));
    const res: any = await firstValueFrom(res$);
    if (res.response_code !== 0) {
      throw new BadRequestException(
        `Trivia API returned code ${res.response_code}`,
      );
    }
    return res.results.map((q: any) => {
      const allOptions = [q.correct_answer, ...q.incorrect_answers].sort(
        () => Math.random() - 0.5,
      );
      return {
        questionText: q.question,
        options: allOptions,
        correctAnswer: q.correct_answer,
        explanation: null,
        difficulty: QuestionDifficulty.MEDIUM,
        category: QuestionCategory.GENERAL_KNOWLEDGE,
      };
    });
  }

  public async createSession(
    createSessionDto: CreateSessionDto,
  ): Promise<SessionResponseDto> {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: createSessionDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user has an active session
    const activeSession = await this.sessionRepository.findOne({
      where: {
        userId: createSessionDto.userId,
        completed: false,
      },
    });

    if (activeSession) {
      throw new BadRequestException(
        'User already has an active assessment session',
      );
    }

    // Get random questions
    if (typeof createSessionDto.totalQuestions !== 'number') {
      throw new BadRequestException('Total questions must be provided');
    }
    const questions = await this.getRandomQuestions(
      createSessionDto.totalQuestions,
    );

    if (questions.length < createSessionDto.totalQuestions) {
      throw new BadRequestException(
        'Not enough questions available in the database',
      );
    }

    // Create new session
    const session = this.sessionRepository.create({
      userId: createSessionDto.userId,
      user,
      totalQuestions: createSessionDto.totalQuestions,
      questionIds: questions.map((q) => q.id),
      startTime: new Date(),
    });

    const savedSession = await this.sessionRepository.save(session);

    this.logger.log(
      `Created new IQ assessment session ${savedSession.id} for user ${createSessionDto.userId}`,
    );

    return this.buildSessionResponse(savedSession, questions[0]);
  }

  public async getSessionProgress(
    sessionId: string,
  ): Promise<SessionResponseDto> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['answers', 'user'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.completed) {
      throw new BadRequestException('Session is already completed');
    }

    const currentQuestionIndex = session.answers.length;
    const questions = await this.getSessionQuestions(session.questionIds ?? []);
    const currentQuestion = questions[currentQuestionIndex];

    return this.buildSessionResponse(session, currentQuestion);
  }

  public async submitAnswer(
    submitAnswerDto: SubmitAnswerDto,
  ): Promise<SessionResponseDto> {
    // For session-based submissions, sessionId is required
    if (!submitAnswerDto.sessionId) {
      throw new BadRequestException(
        'Session ID is required for session-based submissions',
      );
    }

    const session = await this.sessionRepository.findOne({
      where: { id: submitAnswerDto.sessionId },
      relations: ['answers'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.completed) {
      throw new BadRequestException('Session is already completed');
    }

    // Check if answer for this question already exists
    const existingAnswer = session.answers.find(
      (answer) => answer.questionId === submitAnswerDto.questionId,
    );

    if (existingAnswer) {
      throw new BadRequestException(
        'Answer for this question already submitted',
      );
    }

    // Get the question to validate the answer
    const question = await this.questionRepository.findOne({
      where: { id: submitAnswerDto.questionId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Determine if answer is correct
    const isCorrect =
      !submitAnswerDto.skipped &&
      submitAnswerDto.selectedOption === question.correctAnswer;

    // Create and save the answer
    const answer = this.answerRepository.create({
      sessionId: submitAnswerDto.sessionId,
      session,
      questionId: submitAnswerDto.questionId,
      question,
      selectedOption: submitAnswerDto.selectedOption,
      isCorrect,
      skipped: submitAnswerDto.skipped || false,
    });

    await this.answerRepository.save(answer);

    // Log the attempt using IqAttemptService
    if (!submitAnswerDto.skipped && submitAnswerDto.selectedOption) {
      try {
        const createAttemptDto: CreateAttemptDto = {
          userId: session.userId,
          questionId: submitAnswerDto.questionId,
          selectedAnswer: submitAnswerDto.selectedOption,
          correctAnswer: question.correctAnswer,
          isCorrect,
        };
        await this.iqAttemptService.create(createAttemptDto);
      } catch (error) {
        this.logger.warn(
          `Failed to log attempt for session ${submitAnswerDto.sessionId}: ${error.message}`,
        );
        // Don't fail the submission if attempt logging fails
      }
    }

    // Update session score if answer is correct
    if (isCorrect) {
      session.score += 1;
      await this.sessionRepository.save(session);
    }

    this.logger.log(
      `Answer submitted for session ${submitAnswerDto.sessionId}, question ${submitAnswerDto.questionId}`,
    );

    // Check if this was the last question
    if (session.answers.length + 1 >= session.totalQuestions) {
      // Complete the session and return a SessionResponseDto with completed: true and no next question
      await this.completeSession(submitAnswerDto.sessionId);
      const completedSession = await this.sessionRepository.findOne({
        where: { id: submitAnswerDto.sessionId },
        relations: ['answers', 'user'],
      });
      if (!completedSession) {
        throw new NotFoundException('Session not found');
      }
      return this.buildSessionResponse(completedSession, undefined);
    }

    // Get next question
    const questions = await this.getSessionQuestions(session.questionIds ?? []);
    const nextQuestion = questions[session.answers.length + 1];

    // Reload session with updated answers
    const updatedSession = await this.sessionRepository.findOne({
      where: { id: submitAnswerDto.sessionId },
      relations: ['answers', 'user'],
    });

    if (!updatedSession) {
      throw new NotFoundException('Session not found');
    }

    return this.buildSessionResponse(updatedSession, nextQuestion);
  }

  async completeSession(
    sessionId: string,
  ): Promise<CompletedSessionResponseDto> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['answers', 'answers.question'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.completed) {
      throw new BadRequestException('Session is already completed');
    }

    // Mark session as completed
    session.completed = true;
    session.endTime = new Date();
    await this.sessionRepository.save(session);

    this.logger.log(
      `Completed IQ assessment session ${sessionId} with score ${session.score}/${session.totalQuestions}`,
    );

    return this.buildCompletedSessionResponse(session);
  }

  async skipQuestion(
    sessionId: string,
    questionId: string,
  ): Promise<SessionResponseDto> {
    return this.submitAnswer({
      sessionId,
      questionId,
      skipped: true,
    });
  }

  private async getRandomQuestions(count: number): Promise<IQQuestion[]> {
    const dbQuestions = await this.questionRepository
      .createQueryBuilder('question')
      .orderBy('RANDOM()')
      .limit(count)
      .getMany();

    if (dbQuestions.length >= count) {
      return dbQuestions;
    }

    const missing = count - dbQuestions.length;
    const external = await this.fetchExternalQuestions(missing);
    const created = this.questionRepository.create(external);
    return [...dbQuestions, ...(await this.questionRepository.save(created))];
  }

  private async getSessionQuestions(
    questionIds: string[],
  ): Promise<IQQuestion[]> {
    if (!questionIds || questionIds.length === 0) {
      return [];
    }

    const questions = await this.questionRepository.findByIds(questionIds);

    // Maintain the original order
    return questionIds
      .map((id) => questions.find((q) => q.id === id))
      .filter((q): q is IQQuestion => q !== undefined);
  }

  private buildSessionResponse(
    session: IQAssessmentSession,
    currentQuestion?: IQQuestion,
  ): SessionResponseDto {
    const timeElapsed = Math.floor(
      (new Date().getTime() - session.startTime.getTime()) / 1000,
    );
    const currentQuestionNumber = session.answers
      ? session.answers.length + 1
      : 1;

    return {
      id: session.id,
      userId: session.userId,
      startTime: session.startTime,
      endTime: session.endTime,
      score: session.score,
      totalQuestions: session.totalQuestions,
      completed: session.completed,
      progress: {
        currentQuestion: currentQuestionNumber,
        totalQuestions: session.totalQuestions,
        timeElapsed,
        completed: session.completed,
      },
      currentQuestion: currentQuestion
        ? {
            id: currentQuestion.id,
            questionText: currentQuestion.questionText,
            options: currentQuestion.options,
            // Don't include explanation during assessment
          }
        : undefined,
    };
  }

  private buildCompletedSessionResponse(
    session: IQAssessmentSession,
  ): CompletedSessionResponseDto {
    const endTime = session.endTime ? session.endTime.getTime() : Date.now();
    const timeElapsed = Math.floor(
      (endTime - session.startTime.getTime()) / 1000,
    );
    const percentage = Math.round(
      (session.score / session.totalQuestions) * 100,
    );

    return {
      id: session.id,
      score: session.score,
      totalQuestions: session.totalQuestions,
      percentage,
      timeElapsed,
      answers: session.answers.map((answer) => ({
        questionId: answer.questionId,
        questionText: answer.question.questionText,
        selectedOption: answer.selectedOption,
        correctAnswer: answer.question.correctAnswer,
        isCorrect: answer.isCorrect,
        skipped: answer.skipped,
        explanation: answer.question.explanation,
      })),
    };
  }

  public async getUserSessions(userId: string): Promise<IQAssessmentSession[]> {
    return this.sessionRepository.find({
      where: { userId },
      order: { startTime: 'DESC' },
      relations: ['answers'],
    });
  }

  async getSessionById(sessionId: string): Promise<IQAssessmentSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['answers', 'answers.question', 'user'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async submitStandaloneAnswer(
    submitAnswerDto: StandaloneSubmitAnswerDto,
    userId?: string,
  ): Promise<AnswerSubmissionResponseDto> {
    // Get the question to validate the answer
    const question = await this.questionRepository.findOne({
      where: { id: submitAnswerDto.questionId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Determine if answer is correct
    const isCorrect = submitAnswerDto.selectedAnswer === question.correctAnswer;

    // Emit event for streak tracking
    if (userId) {
      this.eventEmitter.emit('iq.question.answered', {
        userId: userId,
        isCorrect,
      });
    }

    // Log the attempt using IqAttemptService
    try {
      const createAttemptDto: CreateAttemptDto = {
        userId,
        questionId: submitAnswerDto.questionId,
        selectedAnswer: submitAnswerDto.selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
      };
      await this.iqAttemptService.create(createAttemptDto);
    } catch (error) {
      this.logger.warn(
        `Failed to log attempt for question ${submitAnswerDto.questionId}: ${error.message}`,
      );
      // Don't fail the submission if attempt logging fails
    }

    this.logger.log(
      `Standalone answer submitted for question ${submitAnswerDto.questionId}`,
    );

    return {
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      selectedAnswer: submitAnswerDto.selectedAnswer,
      questionId: submitAnswerDto.questionId,
    };
  }

  async getRandomQuestionsWithFilters(
    queryDto: RandomQuestionsQueryDto,
  ): Promise<IQQuestion[]> {
    const { difficulty, category, count = 1 } = queryDto;

    // Build query with filters
    const queryBuilder = this.questionRepository
      .createQueryBuilder('question')
      .orderBy('RANDOM()')
      .limit(count);

    if (difficulty) {
      queryBuilder.andWhere('question.difficulty = :difficulty', {
        difficulty,
      });
    }

    if (category) {
      queryBuilder.andWhere('question.category = :category', { category });
    }

    const dbQuestions = await queryBuilder.getMany();

    if (dbQuestions.length >= count) {
      // Shuffle options for each question before returning
      return dbQuestions.map((question) => ({
        ...question,
        options: [...question.options].sort(() => Math.random() - 0.5),
      }));
    }

    // If not enough questions in DB, fetch from external API
    const missing = count - dbQuestions.length;
    const externalQuestions = await this.fetchExternalQuestionsWithFilters(
      missing,
      difficulty,
      category,
    );

    // Create and save external questions
    const createdQuestions = this.questionRepository.create(externalQuestions);
    const savedQuestions = await this.questionRepository.save(createdQuestions);

    // Combine and shuffle options
    const allQuestions = [...dbQuestions, ...savedQuestions];
    return allQuestions.map((question) => ({
      ...question,
      options: [...question.options].sort(() => Math.random() - 0.5),
    }));
  }

  private async fetchExternalQuestionsWithFilters(
    amount: number,
    difficulty?: QuestionDifficulty,
    category?: QuestionCategory,
  ) {
    // Map our enums to Open Trivia API format
    const difficultyMap = {
      [QuestionDifficulty.EASY]: 'easy',
      [QuestionDifficulty.MEDIUM]: 'medium',
      [QuestionDifficulty.HARD]: 'hard',
    };

    const categoryMap = {
      [QuestionCategory.SCIENCE]: 17, // Science & Nature
      [QuestionCategory.MATHEMATICS]: 19, // Mathematics
      [QuestionCategory.HISTORY]: 23, // History
      [QuestionCategory.GEOGRAPHY]: 22, // Geography
      [QuestionCategory.LITERATURE]: 10, // Entertainment: Books
      [QuestionCategory.ART]: 25, // Art
      [QuestionCategory.SPORTS]: 21, // Sports
      [QuestionCategory.ENTERTAINMENT]: 11, // Entertainment: Film
      [QuestionCategory.GENERAL_KNOWLEDGE]: 9, // General Knowledge
    };

    let url = `https://opentdb.com/api.php?amount=${amount}&type=multiple`;

    if (difficulty) {
      url += `&difficulty=${difficultyMap[difficulty]}`;
    }

    if (category && categoryMap[category]) {
      url += `&category=${categoryMap[category]}`;
    }

    const res$ = this.httpService.get(url).pipe(map((resp) => resp.data));
    const res: any = await firstValueFrom(res$);

    if (res.response_code !== 0) {
      throw new BadRequestException(
        `Trivia API returned code ${res.response_code}`,
      );
    }

    return res.results.map((q: any) => {
      const allOptions = [q.correct_answer, ...q.incorrect_answers].sort(
        () => Math.random() - 0.5,
      );
      return {
        questionText: q.question,
        options: allOptions,
        correctAnswer: q.correct_answer,
        explanation: null,
        difficulty: difficulty || QuestionDifficulty.MEDIUM,
        category: category || QuestionCategory.GENERAL_KNOWLEDGE,
      };
    });
  }

  public async startQuiz(dto: StartQuizDto) {
    const questions = await this.getRandomQuestionsWithFilters({
      difficulty: dto.difficulty,
      category: dto.category,
      count: dto.numberOfQuestions,
    });

    return { questions };
  }

  public async submitQuiz(activeUser: ActiveUserData, dto: SubmitQuizDto) {
    let correctCount = 0;

    const detailedBreakdown: {
      questionId: string;
      questionText: string;
      selectedAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    }[] = [];

    for (const response of dto.responses) {
      const question = await this.questionRepository.findOne({
        where: { id: response.questionId },
      });

      if (!question) {
        continue;
      }

      const isCorrect = response.selectedAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;

      detailedBreakdown.push({
        questionId: question.id,
        questionText: question.questionText,
        selectedAnswer: response.selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
      });
    }

    const score = Math.round((correctCount / dto.responses.length) * 100);

    const user = await this.userRepository.findOne({
      where: { id: activeUser.sub },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.achievementService.achievementUnlocker(user);

    const incorrectCount = dto.responses.length - correctCount;

    return {
      score,
      correctCount,
      incorrectCount,
      breakdown: detailedBreakdown,
    };
  }
}
