import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class PuzzleSubmissionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 101 })
  @IsInt()
  puzzleId: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  isCorrect: boolean;

  @ApiProperty({ example: new Date().toISOString() })
  @Type(() => Date)
  @IsDate()
  timestamp: Date;
}