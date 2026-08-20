import { Injectable } from '@nestjs/common';
import {
  RewardEligibilityInput,
  RewardEligibilityResult,
} from '../interfaces/reward.interface';

@Injectable()
export class RewardService {
  private readonly MINIMUM_SCORE_FOR_REWARD = 100;

  checkEligibility(
    input: RewardEligibilityInput,
  ): RewardEligibilityResult {
    if (!input.correct) {
      return {
        eligible: false,
        reason: 'Answer was incorrect',
      };
    }

    if (input.score < this.MINIMUM_SCORE_FOR_REWARD) {
      return {
        eligible: false,
        reason: 'Score is below the reward threshold',
      };
    }

    return {
      eligible: true,
      reason: 'Player meets reward eligibility requirements',
    };
  }
}