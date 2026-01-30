import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { SubmitAnswerDto } from './dtos/submit-answer.dto';

@Controller('progress')
@ApiTags('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit a puzzle answer' })
  @ApiResponse({ status: 200, description: 'Answer processed successfully' })
  async submitAnswer(@Body() submitAnswerDto: SubmitAnswerDto) {
    return this.progressService.submitAnswer(submitAnswerDto);
  }
}
