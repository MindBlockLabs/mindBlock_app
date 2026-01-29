import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for the Daily Quest status endpoint.
 * Returns only essential progress information for dashboard/UI consumption.
 */
export class DailyQuestStatusDto {
  @ApiProperty({
    description: "Total number of questions in today's daily quest",
    example: 5,
  })
  totalQuestions: number;

  @ApiProperty({
    description: 'Number of questions completed so far (0-5)',
    example: 2,
  })
  completedQuestions: number;

  @ApiProperty({
    description: 'Whether the entire daily quest has been completed',
    example: false,
  })
  isCompleted: boolean;
}
