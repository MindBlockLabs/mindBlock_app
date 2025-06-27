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
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from "@nestjs/swagger"
import { CreateSessionDto } from "../dto/create-session.dto"
import { SubmitAnswerDto } from "../dto/submit-answer.dto"
import { CompleteSessionDto } from "../dto/complete-session.dto"
import { SessionResponseDto, CompletedSessionResponseDto } from "../dto/session-response.dto"
import { AttemptResponseDto, UserAttemptsStatsDto } from "../dto/attempt-response.dto"
import { IQAssessmentService } from "../providers/iq-assessment.service"
import { IqAttemptService } from "../providers/iq-attempt.service"

@ApiTags("IQ Assessment")
@Controller("iq-assessment")
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class IQAssessmentController {
  constructor(
    private readonly iqAssessmentService: IQAssessmentService,
    private readonly iqAttemptService: IqAttemptService,
    private readonly svc: IQAssessmentService,
  ) {}

  @Post("sessions")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Start a new IQ assessment session" })
  @ApiBody({ type: CreateSessionDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Session created successfully",
    type: SessionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "User already has an active session or not enough questions available",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "User not found",
  })
  async createSession(
    createSessionDto: CreateSessionDto, // Remove the decorator here
  ): Promise<SessionResponseDto> {
    console.log("Received createSessionDto:", createSessionDto)
    return this.iqAssessmentService.createSession(createSessionDto)
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get current session progress and next question' })
  @ApiParam({ name: 'sessionId', description: 'Session UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session progress retrieved successfully',
    type: SessionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Session is already completed',
  })
  async getSessionProgress(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ): Promise<SessionResponseDto> {
    return this.iqAssessmentService.getSessionProgress(sessionId);
  }

  @Post("sessions/submit-answer")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Submit an answer for a question" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Answer submitted successfully",
    type: SessionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Session or question not found",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Session completed or answer already submitted for this question",
  })
  async submitAnswer(
    submitAnswerDto: SubmitAnswerDto, // Remove the decorator here
  ): Promise<SessionResponseDto> {
    return this.iqAssessmentService.submitAnswer(submitAnswerDto)
  }

  @Post("sessions/complete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Complete an assessment session" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Session completed successfully",
    type: CompletedSessionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Session not found",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Session is already completed",
  })
  async completeSession(
    completeSessionDto: CompleteSessionDto, // Remove the decorator here
  ): Promise<CompletedSessionResponseDto> {
    return this.iqAssessmentService.completeSession(completeSessionDto.sessionId)
  }

  @Post("sessions/:sessionId/skip/:questionId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Skip a question" })
  @ApiParam({ name: "sessionId", description: "Session UUID" })
  @ApiParam({ name: "questionId", description: "Question UUID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Question skipped successfully",
    type: SessionResponseDto,
  })
  async skipQuestion(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
  ): Promise<SessionResponseDto> {
    return this.iqAssessmentService.skipQuestion(sessionId, questionId)
  }

  @Get('users/:userId/sessions')
  @ApiOperation({ summary: 'Get all sessions for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User sessions retrieved successfully',
  })
  async getUserSessions(@Param('userId', ParseIntPipe) userId: string) {
    return this.iqAssessmentService.getUserSessions(userId);
  }

  @Get('sessions/:sessionId/details')
  @ApiOperation({ summary: 'Get detailed session information' })
  @ApiParam({ name: 'sessionId', description: 'Session UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session details retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
  })
  async getSessionDetails(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.iqAssessmentService.getSessionById(sessionId);
  }

  @Get("external/random")
  async getOneExternal() {
    const questions: ExternalIQQuestion[] = await this.svc.fetchExternalQuestions(1)
    const [q] = questions
    return q
  }

  // New Attempt Analytics Endpoints

  @Get('attempts/users/:userId')
  @ApiOperation({ summary: 'Get all attempts for a specific user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User attempts retrieved successfully',
    type: [AttemptResponseDto],
  })
  async getUserAttempts(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<AttemptResponseDto[]> {
    return this.iqAttemptService.findAllByUser(userId);
  }

  @Get('attempts/users/:userId/stats')
  @ApiOperation({ summary: 'Get attempt statistics for a specific user' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User attempt statistics retrieved successfully',
    type: UserAttemptsStatsDto,
  })
  async getUserAttemptStats(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<UserAttemptsStatsDto> {
    return this.iqAttemptService.getUserStats(userId);
  }

  @Get('attempts/questions/:questionId')
  @ApiOperation({ summary: 'Get all attempts for a specific question' })
  @ApiParam({ name: 'questionId', description: 'Question UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Question attempts retrieved successfully',
    type: [AttemptResponseDto],
  })
  async getQuestionAttempts(
    @Param('questionId', ParseUUIDPipe) questionId: string,
  ): Promise<AttemptResponseDto[]> {
    return this.iqAttemptService.findAllByQuestion(questionId);
  }

  @Get('attempts/recent')
  @ApiOperation({ summary: 'Get recent attempts for analytics' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of attempts to return (default: 100)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recent attempts retrieved successfully',
    type: [AttemptResponseDto],
  })
  async getRecentAttempts(
    @Query('limit') limit?: number,
  ): Promise<AttemptResponseDto[]> {
    return this.iqAttemptService.getRecentAttempts(limit);
  }

  @Get("attempts/stats/global")
  @ApiOperation({ summary: "Get global attempt statistics" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Global statistics retrieved successfully",
  })
  async getGlobalStats() {
    return this.iqAttemptService.getGlobalStats()
  }

  @Get("attempts/date-range")
  @ApiOperation({ summary: "Get attempts within a date range" })
  @ApiQuery({ name: "startDate", description: "Start date (ISO string)" })
  @ApiQuery({ name: "endDate", description: "End date (ISO string)" })
  @ApiQuery({ name: "userId", required: false, description: "Filter by user ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Attempts retrieved successfully",
    type: [AttemptResponseDto],
  })
  async getAttemptsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('userId') userId?: string,
  ): Promise<AttemptResponseDto[]> {
    return this.iqAttemptService.getAttemptsByDateRange(new Date(startDate), new Date(endDate), userId)
  }
}
