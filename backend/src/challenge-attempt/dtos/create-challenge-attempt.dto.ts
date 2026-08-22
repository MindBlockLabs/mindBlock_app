import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/**
 * DTO for starting a new challenge attempt.
 *
 * `userId` is intentionally not part of this DTO: the attempt is always
 * created for the authenticated caller (derived from the JWT in the
 * controller), never a client-supplied id, to prevent submitting attempts
 * as another user.
 * sessionId is optional and links this attempt to a game session.
 */
export class CreateChallengeAttemptDto {
  @IsUUID('4', { message: 'challengeId must be a valid UUID v4' })
  challengeId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sessionId?: string;
}
