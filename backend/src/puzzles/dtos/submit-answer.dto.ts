import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsObject } from 'class-validator';

export class SubmitAnswerDto {
  @ApiProperty({
    example: 1,
    description: 'The ID of the puzzle being submitted',
  })
  @IsNotEmpty()
  puzzleId: number;

  @ApiProperty({
    example: 'class Solution: def maxDepth(root):',
    description: 'The answer/solution provided by the user',
  })
  @IsNotEmpty()
  @IsString()
  answer: string;

  @ApiProperty({
    example: { language: 'python' },
    description: 'Additional metadata about the submission',
    required: false,
  })
  @IsObject()
  metadata?: Record<string, any>;
}
