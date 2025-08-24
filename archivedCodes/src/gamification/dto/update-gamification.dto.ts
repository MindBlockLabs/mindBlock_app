import { PartialType } from '@nestjs/swagger';
import { CreateGamificationDto } from './create-gamification.dto';

export class UpdateGamificationDto extends PartialType(CreateGamificationDto) {}
