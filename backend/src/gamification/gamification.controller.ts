
import { Controller, Post, Body } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { BonusRewardDto } from './dto/bonus-reward.dto';
import { PuzzleSubmissionDto } from './dto/puzzle-submission.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Gamification')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Post('bonus-reward')
  async awardBonus(@Body() dto: BonusRewardDto): Promise<void> {
    return this.gamificationService.awardBonusRewards(dto);
  }
}
