import { Module } from '@nestjs/common';
import { RewardService } from './providers/reward.service';

@Module({
  providers: [RewardService],
  exports: [RewardService],
})
export class RewardsModule {}
