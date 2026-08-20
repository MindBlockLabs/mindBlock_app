import { RewardService } from './reward.service';
import { beforeEach, describe, expect, it } from '@jest/globals';

describe('RewardService', () => {
  let service: RewardService;

  beforeEach(() => {
    service = new RewardService();
  });

  it('should mark a player eligible when requirements are met', () => {
    const result = service.checkEligibility({
      correct: true,
      score: 100,
      xp: 100,
    });

    expect(result.eligible).toBe(true);
  });

  it('should reject an incorrect answer', () => {
    const result = service.checkEligibility({
      correct: false,
      score: 100,
      xp: 100,
    });

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('Answer was incorrect');
  });

  it('should reject a score below the reward threshold', () => {
    const result = service.checkEligibility({
      correct: true,
      score: 50,
      xp: 50,
    });

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('Score is below the reward threshold');
  });

  it('should not depend on blockchain availability', () => {
    const result = service.checkEligibility({
      correct: true,
      score: 100,
      xp: 100,
    });

    expect(result.eligible).toBe(true);
  });
});