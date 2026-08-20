import { Injectable } from '@nestjs/common';
import {
  ScoreCalculationInput,
  ScoreCalculationResult,
} from '../interfaces/score.interface';

@Injectable()
export class ScoreService {
  calculateScore(
    input: ScoreCalculationInput,
  ): ScoreCalculationResult {
    if (!input.correct) {
      return {
        score: 0,
        correct: false,
      };
    }

    const score = Math.max(0, input.basePoints);

    return {
      score,
      correct: true,
    };
  }
}