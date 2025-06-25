// src/puzzle/puzzle.controller.ts
import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PuzzleFilterDto, SubmitPuzzleDto, PuzzleProgressDto } from './dto/puzzle.dto';
import { Auth } from '../auth/decorators/auth.decorator';
import { ActiveUser } from '../auth/decorators/activeUser.decorator';

@ApiTags('Puzzle')
@Controller('puzzles')
@ApiBearerAuth()
export class PuzzleController {
  constructor() {}
}