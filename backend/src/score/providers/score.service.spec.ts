import { ScoreService } from './score.service';
import { beforeEach, describe, expect, it } from '@jest/globals';

describe('ScoreService', () => {
  let service: ScoreService;

  beforeEach(() => {
    service = new ScoreService();
  });

  it('should award base score for a correct answer', () => {
    const result = service.calculateScore({
      correct: true,
      basePoints: 100,
    });

    expect(result.score).toBe(100);
    expect(result.correct).toBe(true);
  });

  it('should award zero score for an incorrect answer', () => {
    const result = service.calculateScore({
      correct: false,
      basePoints: 100,
    });

    expect(result.score).toBe(0);
    expect(result.correct).toBe(false);
  });

  it('should never produce a negative score', () => {
    const result = service.calculateScore({
      correct: true,
      basePoints: -10,
    });

    expect(result.score).toBe(0);
  });
});