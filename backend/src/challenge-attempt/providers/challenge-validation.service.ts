import { Injectable } from '@nestjs/common';

@Injectable()
export class ChallengeValidationService {
  /**
   * Validates a player's answer against the authoritative
   * answer stored on the backend.
   */
  validateAnswer(
    userAnswer: string,
    correctAnswer: string,
  ): boolean {
    return (
      userAnswer.trim().toLowerCase() ===
      correctAnswer.trim().toLowerCase()
    );
  }

  /**
   * Calculates the score on the backend.
   * The client never provides the score.
   */
  calculateScore(
    basePoints: number,
    timeSpent: number,
    timeLimit: number,
  ): number {
    if (timeLimit <= 0) {
      return basePoints;
    }

    let bonus = 0;

    if (timeSpent < timeLimit) {
      bonus = ((timeLimit - timeSpent) / timeLimit) * 0.5;
    }

    return Math.round(basePoints * (1 + bonus));
  }
}