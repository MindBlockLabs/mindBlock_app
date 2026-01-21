import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport'; // Import from @nestjs/passport
import { SubmissionProvider } from '../providers/submission.provider';
import { SubmitAnswerDto } from '../dtos/submit-answer.dto';
import { SubmitAnswerResponseDto } from '../dtos/submit-answer-response.dto';
import { ActiveUser } from '../../auth/decorators/activeUser.decorator';

@ApiTags('puzzles')
@Controller('puzzles')
@UseGuards(AuthGuard('jwt')) // Specify the strategy name
@ApiBearerAuth()
export class PuzzlesController {
  constructor(private readonly submissionProvider: SubmissionProvider) {}

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit an answer to a puzzle',
    description: 'Submit a puzzle answer, validate correctness, and update user progression',
  })
  @ApiResponse({
    status: 200,
    description: 'Answer submitted successfully',
    type: SubmitAnswerResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 404,
    description: 'Puzzle or user not found',
  })
  async submitAnswer(
    @ActiveUser('sub') userId: string,
    @Body() dto: SubmitAnswerDto,
  ): Promise<SubmitAnswerResponseDto> {
    return this.submissionProvider.submitAnswer(userId, dto);
  }
}