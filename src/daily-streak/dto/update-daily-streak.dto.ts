import { PartialType } from '@nestjs/swagger';
import { CreateDailyStreakDto } from './create-daily-streak.dto';

export class UpdateDailyStreakDto extends PartialType(CreateDailyStreakDto) {}
