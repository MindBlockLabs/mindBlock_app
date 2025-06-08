// dto/create-analytics-event.dto.ts
import { IsString, IsNumber, IsObject } from 'class-validator';

export class CreateAnalyticsEventDto {
  @IsString()
  eventType: string;

  @IsNumber()
  userId: number;

  @IsObject()
  metadata: Record<string, any>;
}