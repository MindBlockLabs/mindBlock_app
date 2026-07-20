import { IsString, IsObject, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrackEventDto {
  @ApiProperty({
    description: 'Event type following the noun_pastTenseVerb convention',
    example: 'puzzle_attempted',
  })
  @IsString()
  eventType: string;

  @ApiPropertyOptional({
    description: 'Arbitrary payload for the event',
    example: { puzzleId: 'uuid', difficulty: 'hard', timeSpent: 45 },
  })
  @IsObject()
  @IsOptional()
  payload?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'User identifier if the event is tied to an authenticated user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  userId?: string;
}
