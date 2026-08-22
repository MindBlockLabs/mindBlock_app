import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for submitting an answer to an existing attempt.
 *
 * timeSpent is in seconds, measured client-side from when the player
 * opened the challenge to when they pressed submit.
 *
 * idempotencyKey is optional but strongly recommended. When provided,
 * the backend guarantees the same submission cannot award XP, advance
 * a session, or create duplicate rewards even if the request is sent
 * multiple times (double-click, network retry, browser refresh).
 *
 * If omitted, a deterministic key is derived from the attemptId,
 * answer, and timeSpent — but a client-generated UUID v4 is preferred
 * for true idempotency across retries with the same logical submission.
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

  @ApiPropertyOptional({
    description:
      'Client-generated idempotency key (UUID v4 recommended). Prevents duplicate XP awards, session advances, and reward eligibility on retries.',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
