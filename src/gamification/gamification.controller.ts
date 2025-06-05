
import { Controller, Post, Body } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { BonusRewardDto } from './dto/bonus-reward.dto';
import { PuzzleSubmissionDto } from './dto/puzzle-submission.dto';
import { PuzzleRewardResponseDto } from './dto/puzzle-reward-response.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Gamification')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Post('bonus-reward')
  async awardBonus(@Body() dto: BonusRewardDto): Promise<void> {
    return this.gamificationService.awardBonusRewards(dto);
  }
  @Post('submit-puzzle')
  async submitPuzzle(@Body() dto: PuzzleSubmissionDto): Promise<PuzzleRewardResponseDto> {
    const { userId, puzzleId, isCorrect } = dto;
    return this.gamificationService.processPuzzleSubmission(userId, puzzleId, isCorrect);
  }
}
