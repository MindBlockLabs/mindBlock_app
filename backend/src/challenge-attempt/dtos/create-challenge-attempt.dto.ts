import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * DTO for starting a new challenge attempt.
 *
 * Minimal data required: who is attempting which challenge.
 * sessionId is optional and links this attempt to a game session.
 */
export class CreateChallengeAttemptDto {
  @IsUUID('4', { message: 'userId must be a valid UUID v4' })
  userId: string;

  @IsUUID('4', { message: 'challengeId must be a valid UUID v4' })
  challengeId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sessionId?: string;
}
