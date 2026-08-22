import { ApiProperty } from '@nestjs/swagger';
import { ChallengeAttempt } from '../entities/challenge-attempt.entity';

/** Minimal puzzle shape needed to render the next challenge without a second round trip. */
export class PuzzleSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  question: string;

  @ApiProperty({ type: [String] })
  options: string[];

  @ApiProperty()
  difficulty: string;

  @ApiProperty()
  points: number;

  @ApiProperty()
  timeLimit: number;

  @ApiProperty()
  categoryId: string;
}

export class XpResultDto {
  @ApiProperty()
  awarded: number;

  @ApiProperty()
  levelUp: boolean;

  @ApiProperty()
  currentLevel: number;

  @ApiProperty()
  currentXp: number;
}

export class SessionProgressDto {
  @ApiProperty()
  attemptsInSession: number;

  @ApiProperty()
  sessionTarget: number;

  @ApiProperty()
  sessionCompleted: boolean;
}

/**
 * Response for POST /challenge-attempts/submit — the full result of the
 * post-submission pipeline (validate, score, XP, progress, next challenge,
 * session completion).
 */
export class SubmitAttemptResponseDto {
  @ApiProperty({ type: ChallengeAttempt })
  attempt: ChallengeAttempt;

  @ApiProperty()
  isCorrect: boolean;

  @ApiProperty()
  feedback: string;

  @ApiProperty({ type: XpResultDto, nullable: true })
  xp: XpResultDto | null;

  @ApiProperty({ type: SessionProgressDto })
  progress: SessionProgressDto;

  @ApiProperty({ type: PuzzleSummaryDto, nullable: true })
  nextChallenge: PuzzleSummaryDto | null;

  @ApiProperty({
    description:
      'True when this response is a cached replay of an already-terminal attempt (duplicate submit), not a fresh grading.',
  })
  isDuplicateReplay: boolean;
}
