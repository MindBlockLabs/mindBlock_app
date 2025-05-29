import { Module } from '@nestjs/common';
import { BadgeService } from './badge.service';
import { BadgeController } from './badge.controller';

@Module({
  controllers: [BadgeController],
  providers: [BadgeService],
})
export class BadgeModule {}
