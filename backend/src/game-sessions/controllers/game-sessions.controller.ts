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
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GameSessionsService } from '../providers/game-sessions.service';
import { CreateGameSessionDto } from '../dtos/create-game-session.dto';
import { UpdateGameSessionStatusDto } from '../dtos/update-game-session-status.dto';
import { GameSessionResponseDto } from '../dtos/game-session-response.dto';
import { GameSession } from '../entities/game-session.entity';
import { ActiveUser } from '../../auth/decorators/activeUser.decorator';
import { ActiveUserData } from '../../auth/interfaces/activeInterface';

@ApiTags('game-sessions')
@Controller('game-sessions')
export class GameSessionsController {
  constructor(private readonly gameSessionsService: GameSessionsService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /game-sessions
  // ─────────────────────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new game session',
    description:
      'Creates a game session in CREATED state for the authenticated user (or a guest). ' +
      'Call PATCH /game-sessions/:id/status with status=ACTIVE to start it.',
  })
  @ApiResponse({
    status: 201,
    description: 'Game session created successfully',
    type: GameSessionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async create(
    @Body() dto: CreateGameSessionDto,
    @ActiveUser() activeUser: ActiveUserData | undefined,
  ): Promise<GameSession> {
    const userId = activeUser?.sub ?? null;
    return this.gameSessionsService.create(dto, userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /game-sessions  →  list all sessions for the current user
  // ─────────────────────────────────────────────────────────────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all game sessions for the authenticated user',
    description: 'Returns sessions ordered by creation date, most recent first.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sessions retrieved successfully',
    type: [GameSessionResponseDto],
  })
  async findAll(
    @ActiveUser() activeUser: ActiveUserData,
  ): Promise<GameSession[]> {
    return this.gameSessionsService.findAllByUser(activeUser.sub);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /game-sessions/active
  // ─────────────────────────────────────────────────────────────────────────────

  @Get('active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get the currently active session for the authenticated user',
    description: 'Returns the single ACTIVE session, or null if none exists.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active session (or null)',
    type: GameSessionResponseDto,
  })
  async findActive(
    @ActiveUser() activeUser: ActiveUserData,
  ): Promise<GameSession | null> {
    return this.gameSessionsService.findActiveSession(activeUser.sub);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /game-sessions/:id
  // ─────────────────────────────────────────────────────────────────────────────

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a game session by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiQuery({
    name: 'guestId',
    required: false,
    description: 'Guest identifier (for unauthenticated sessions)',
  })
  @ApiResponse({
    status: 200,
    description: 'Session found',
    type: GameSessionResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden – not session owner' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @ActiveUser() activeUser: ActiveUserData | undefined,
    @Query('guestId') guestId?: string,
  ): Promise<GameSession> {
    const userId = activeUser?.sub ?? null;
    return this.gameSessionsService.findAndVerifyOwnership(id, userId, guestId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PATCH /game-sessions/:id/status
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update the status of a game session',
    description:
      'Validates the requested status transition according to the state machine ' +
      'and applies it. Invalid transitions return HTTP 400.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiQuery({
    name: 'guestId',
    required: false,
    description: 'Guest identifier (for unauthenticated sessions)',
  })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
    type: GameSessionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition or validation error',
  })
  @ApiResponse({ status: 403, description: 'Forbidden – not session owner' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGameSessionStatusDto,
    @ActiveUser() activeUser: ActiveUserData | undefined,
    @Query('guestId') guestId?: string,
  ): Promise<GameSession> {
    const userId = activeUser?.sub ?? null;
    return this.gameSessionsService.updateStatus(id, dto, userId, guestId);
  }
}
