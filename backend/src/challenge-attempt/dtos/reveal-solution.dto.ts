import { IsUUID } from 'class-validator';

/**
 * DTO for revealing the solution of an active attempt.
 *
 * Revealing the solution marks the attempt as INCORRECT and
 * sets solutionRevealed = true to prevent scoring.
 */
export class RevealSolutionDto {
  @IsUUID('4', { message: 'attemptId must be a valid UUID v4' })
  attemptId: string;
}
