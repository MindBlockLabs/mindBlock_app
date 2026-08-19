import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

/**
 * DTO for submitting an answer to an existing attempt.
 *
 * timeSpent is in seconds, measured client-side from when the player
 * opened the challenge to when they pressed submit.
 */
export class SubmitAttemptDto {
  @IsUUID('4', { message: 'attemptId must be a valid UUID v4' })
  attemptId: string;

  @IsString()
  @IsNotEmpty({ message: 'answer must not be empty' })
  answer: string;

  @IsInt()
  @Min(0, { message: 'timeSpent must be a non-negative integer (seconds)' })
  timeSpent: number;
}
