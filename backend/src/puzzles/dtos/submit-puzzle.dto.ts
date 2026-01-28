import { IsUUID, IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitPuzzleDto {
  @ApiProperty({
    description: 'Unique identifier of the user submitting the answer',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Unique identifier of the puzzle being answered',
    example: '456e7890-e12b-34d5-a678-526614174111',
  })
  @IsUUID()
  @IsNotEmpty()
  puzzleId: string;

  @ApiProperty({
    description: "The user's answer to the puzzle",
    example: 'A',
  })
  @IsString()
  @IsNotEmpty()
  userAnswer: string;

  @ApiProperty({
    description: 'Time spent on the puzzle in seconds',
    example: 30,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  timeSpent: number; // seconds
}