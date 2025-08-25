import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateSessionDto } from '../dto/create-session.dto';
import {
  SubmitAnswerDto,
  StandaloneSubmitAnswerDto,
} from '../dto/submit-answer.dto';
import { CompleteSessionDto } from '../dto/complete-session.dto';
import {
  SessionResponseDto,
  CompletedSessionResponseDto,
} from '../dto/session-response.dto';
import {
  AttemptResponseDto,
  UserAttemptsStatsDto,
} from '../dto/attempt-response.dto';
import { AnswerSubmissionResponseDto } from '../dto/answer-submission-response.dto';
import { RandomQuestionsQueryDto } from '../dto/random-questions-query.dto';
import { RandomQuestionResponseDto } from '../dto/random-question-response.dto';
import { IQAssessmentService } from '../providers/iq-assessment.service';
import { IqAttemptService } from '../providers/iq-attempt.service';
import { ActiveUser } from '../../auth/decorators/activeUser.decorator';
import { ActiveUserData } from '../../auth/interfaces/activeInterface';
import { SubmitQuizDto } from '../dto/submit-quiz.dto';

@ApiTags('IQ Assessment')
@Controller('iq-assessment')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class IQAssessmentController {
  constructor(
    private readonly iqAssessmentService: IQAssessmentService,
    private readonly iqAttemptService: IqAttemptService,
  ) {}

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new IQ assessment session' })
  @ApiBody({ type: CreateSessionDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Session created successfully', type: SessionResponseDto })
  async createSession(@Body() createSessionDto: CreateSessionDto): Promise<SessionResponseDto> {
    return this.iqAssessmentService.createSession(createSessionDto);
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get current session progress and next question' })
  async getSessionProgress(@Param('sessionId', ParseUUIDPipe) sessionId: string): Promise<SessionResponseDto> {
    return this.iqAssessmentService.getSessionProgress(sessionId);
  }

  @Post('sessions/submit-answer')
  @HttpCode(HttpStatus.OK)
  async submitAnswer(@Body() submitAnswerDto: SubmitAnswerDto): Promise<SessionResponseDto> {
    return this.iqAssessmentService.submitAnswer(submitAnswerDto);
  }

  @Post('sessions/complete')
  @HttpCode(HttpStatus.OK)
  async completeSession(@Body() completeSessionDto: CompleteSessionDto): Promise<CompletedSessionResponseDto> {
    return this.iqAssessmentService.completeSession(completeSessionDto.sessionId);
  }

  @Post('sessions/:sessionId/skip/:questionId')
  @HttpCode(HttpStatus.OK)
  async skipQuestion(@Param('sessionId', ParseUUIDPipe) sessionId: string, @Param('questionId', ParseUUIDPipe) questionId: string): Promise<SessionResponseDto> {
    return this.iqAssessmentService.skipQuestion(sessionId, questionId);
  }

  @Get('users/:userId/sessions')
  async getUserSessions(@Param('userId', ParseIntPipe) userId: string) {
    return this.iqAssessmentService.getUserSessions(userId);
  }

  @Get('sessions/:sessionId/details')
  async getSessionDetails(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.iqAssessmentService.getSessionById(sessionId);
  }

  @Get('external/random')
  async getOneExternal() {
    const questions = await this.iqAssessmentService.fetchExternalQuestions(1);
    return questions[0];
  }

  @Get('attempts/users/:userId')
  async getUserAttempts(@Param('userId', ParseUUIDPipe) userId: string): Promise<AttemptResponseDto[]> {
    return this.iqAttemptService.findAllByUser(userId);
  }

  @Get('attempts/users/:userId/stats')
  async getUserAttemptStats(@Param('userId', ParseUUIDPipe) userId: string): Promise<UserAttemptsStatsDto> {
    return this.iqAttemptService.getUserStats(userId);
  }

  @Get('attempts/questions/:questionId')
  async getQuestionAttempts(@Param('questionId', ParseUUIDPipe) questionId: string): Promise<AttemptResponseDto[]> {
    return this.iqAttemptService.findAllByQuestion(questionId);
  }

  @Get('attempts/recent')
  async getRecentAttempts(@Query('limit') limit?: number): Promise<AttemptResponseDto[]> {
    return this.iqAttemptService.getRecentAttempts(limit);
  }

  @Get('attempts/stats/global')
  async getGlobalStats() {
    return this.iqAttemptService.getGlobalStats();
  }

  @Get('attempts/date-range')
  async getAttemptsByDateRange(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Query('userId') userId?: string): Promise<AttemptResponseDto[]> {
    return this.iqAttemptService.getAttemptsByDateRange(new Date(startDate), new Date(endDate), userId);
  }

  @Post('submit')
  async submitStandaloneAnswer(@Body() submitAnswerDto: StandaloneSubmitAnswerDto): Promise<AnswerSubmissionResponseDto> {
    return this.iqAssessmentService.submitStandaloneAnswer(submitAnswerDto);
  }

  @Get('questions/random')
  async getRandomQuestions(@Query() queryDto: RandomQuestionsQueryDto): Promise<RandomQuestionResponseDto[]> {
    const questions = await this.iqAssessmentService.getRandomQuestionsWithFilters(queryDto);
    return questions.map((question) => ({
      id: question.id,
      questionText: question.questionText,
      options: question.options,
      difficulty: question.difficulty,
      category: question.category,
    }));
  }

  @Post('submit')
  async submitQuiz(@ActiveUser() user: ActiveUserData, @Body() dto: SubmitQuizDto) {
    return this.iqAssessmentService.submitQuiz(user, dto);
  }
}
