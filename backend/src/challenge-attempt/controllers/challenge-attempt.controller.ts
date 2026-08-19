import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ChallengeAttemptService } from '../providers/challenge-attempt.service';
import { CreateChallengeAttemptDto } from '../dtos/create-challenge-attempt.dto';
import { SubmitAttemptDto } from '../dtos/submit-attempt.dto';
import { RevealSolutionDto } from '../dtos/reveal-solution.dto';
import { UseHintDto } from '../dtos/use-hint.dto';
import { ChallengeAttempt } from '../entities/challenge-attempt.entity';

@ApiTags('challenge-attempts')
@Controller('challenge-attempts')
export class ChallengeAttemptController {
  constructor(
    private readonly challengeAttemptService: ChallengeAttemptService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /challenge-attempts  →  start a new attempt
  // ─────────────────────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Start a new challenge attempt',
    description:
      'Creates a new ChallengeAttempt record in STARTED state for the given user and challenge. ' +
      'Optionally links the attempt to a game session via sessionId.',
  })
  @ApiResponse({
    status: 201,
    description: 'Attempt started successfully',
    type: ChallengeAttempt,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Challenge not found' })
  async createAttempt(
    @Body() dto: CreateChallengeAttemptDto,
  ): Promise<ChallengeAttempt> {
    return this.challengeAttemptService.createAttempt(dto);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /challenge-attempts/submit  →  submit an answer
  // ─────────────────────────────────────────────────────────────────────────────

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit an answer for an existing attempt',
    description:
      'Records the player answer, validates it against the correct answer, ' +
      'calculates the score (with time bonus), and transitions the attempt ' +
      'to CORRECT or INCORRECT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Answer submitted; attempt updated with result',
    type: ChallengeAttempt,
  })
  @ApiResponse({
    status: 400,
    description: 'Attempt already in terminal state or validation failed',
  })
  @ApiResponse({ status: 404, description: 'Attempt or challenge not found' })
  async submitAttempt(
    @Body() dto: SubmitAttemptDto,
  ): Promise<ChallengeAttempt> {
    return this.challengeAttemptService.submitAttempt(dto);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PATCH /challenge-attempts/hint  →  record hint usage
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch('hint')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record a hint usage for an attempt',
    description:
      'Increments the hintsUsed counter on the attempt. ' +
      'Does not return the hint content — that is fetched separately from the challenge.',
  })
  @ApiResponse({
    status: 200,
    description: 'Hint usage recorded',
    type: ChallengeAttempt,
  })
  @ApiResponse({
    status: 400,
    description: 'Attempt already in terminal state',
  })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  async useHint(@Body() dto: UseHintDto): Promise<ChallengeAttempt> {
    return this.challengeAttemptService.useHint(dto);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PATCH /challenge-attempts/reveal  →  reveal solution
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch('reveal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reveal the solution for an attempt',
    description:
      'Marks solutionRevealed = true, zeroes the score, and if the attempt is ' +
      'still STARTED it is moved to INCORRECT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Solution revealed; attempt updated',
    type: ChallengeAttempt,
  })
  @ApiResponse({
    status: 400,
    description: 'Attempt already in terminal state',
  })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  async revealSolution(
    @Body() dto: RevealSolutionDto,
  ): Promise<ChallengeAttempt> {
    return this.challengeAttemptService.revealSolution(dto);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PATCH /challenge-attempts/:id/expire  →  expire an attempt
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch(':id/expire')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Expire an attempt',
    description:
      'Marks the attempt as EXPIRED when the allowed time has elapsed. ' +
      'Typically called by the server-side scheduler or client when timer fires.',
  })
  @ApiParam({ name: 'id', description: 'UUID of the attempt to expire' })
  @ApiResponse({
    status: 200,
    description: 'Attempt expired successfully',
    type: ChallengeAttempt,
  })
  @ApiResponse({
    status: 400,
    description: 'Attempt already in terminal state',
  })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  async expireAttempt(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ChallengeAttempt> {
    return this.challengeAttemptService.expireAttempt(id);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /challenge-attempts/:id  →  get a single attempt
  // ─────────────────────────────────────────────────────────────────────────────

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single attempt by ID' })
  @ApiParam({ name: 'id', description: 'UUID of the attempt' })
  @ApiResponse({
    status: 200,
    description: 'Attempt retrieved successfully',
    type: ChallengeAttempt,
  })
  @ApiResponse({ status: 404, description: 'Attempt not found' })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ChallengeAttempt> {
    return this.challengeAttemptService.findById(id);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /challenge-attempts/user/:userId  →  all attempts for a user
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all attempts for a given user' })
  @ApiParam({ name: 'userId', description: 'UUID of the user' })
  @ApiResponse({
    status: 200,
    description: 'Attempts retrieved successfully',
    type: [ChallengeAttempt],
  })
  async findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<ChallengeAttempt[]> {
    return this.challengeAttemptService.findByUser(userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /challenge-attempts/session/:sessionId  →  all attempts in a session
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('session/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all attempts belonging to a game session' })
  @ApiParam({ name: 'sessionId', description: 'Session identifier string' })
  @ApiResponse({
    status: 200,
    description: 'Attempts retrieved successfully',
    type: [ChallengeAttempt],
  })
  async findBySession(
    @Param('sessionId') sessionId: string,
  ): Promise<ChallengeAttempt[]> {
    return this.challengeAttemptService.findBySession(sessionId);
  }
}
