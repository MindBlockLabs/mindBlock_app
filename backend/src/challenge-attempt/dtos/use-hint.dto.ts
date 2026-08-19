import { IsUUID } from 'class-validator';

/**
 * DTO for recording that a player used a hint on an attempt.
 *
 * Each use increments hintsUsed on the attempt; the actual hint content
 * is fetched by the caller separately (e.g. from the Puzzle entity).
 */
export class UseHintDto {
  @IsUUID('4', { message: 'attemptId must be a valid UUID v4' })
  attemptId: string;
}
