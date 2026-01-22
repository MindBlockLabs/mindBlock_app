import { IsUUID, IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class SubmitAnswerDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  puzzleId: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  userAnswer: string;

  @IsNumber()
  @IsNotEmpty()
  timeSpent: number; // seconds
}
