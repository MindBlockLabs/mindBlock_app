import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from "@nestjs/swagger"
import { CreateSessionDto } from "../dto/create-session.dto"
import { SubmitAnswerDto } from "../dto/submit-answer.dto"
import { CompleteSessionDto } from "../dto/complete-session.dto"
import { SessionResponseDto, CompletedSessionResponseDto } from "../dto/session-response.dto"
import { IQAssessmentService } from "../providers/iq-assessment.service"

@ApiTags("IQ Assessment")
@Controller("iq-assessment")
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class IQAssessmentController {
  constructor(private readonly iqAssessmentService: IQAssessmentService) {}

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
  async createSession(@Body() createSessionDto: CreateSessionDto): Promise<SessionResponseDto> {
    console.log('Received createSessionDto:', createSessionDto);
    return this.iqAssessmentService.createSession(createSessionDto);
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

  @Post('sessions/submit-answer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit an answer for a question' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Answer submitted successfully',
    type: SessionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session or question not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Session completed or answer already submitted for this question',
  })
  async submitAnswer(@Body() submitAnswerDto: SubmitAnswerDto): Promise<SessionResponseDto> {
    return this.iqAssessmentService.submitAnswer(submitAnswerDto);
  }

  @Post('sessions/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete an assessment session' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session completed successfully',
    type: CompletedSessionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Session not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Session is already completed',
  })
  async completeSession(@Body() completeSessionDto: CompleteSessionDto): Promise<CompletedSessionResponseDto> {
    return this.iqAssessmentService.completeSession(completeSessionDto.sessionId);
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
  async getUserSessions(@Param('userId', ParseIntPipe) userId: number) {
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
  async getSessionDetails(@Param('sessionId', ParseUUIDPipe) sessionId: string) {
    return this.iqAssessmentService.getSessionById(sessionId);
  }
}
