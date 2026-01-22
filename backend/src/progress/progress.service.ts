import { Injectable } from '@nestjs/common';
import { ProgressCalculationProvider } from './providers/progress-calculation.provider';
import { SubmitAnswerDto } from './dtos/submit-answer.dto';

@Injectable()
export class ProgressService {
  constructor(
    private readonly progressCalculationProvider: ProgressCalculationProvider,
  ) {}

  /**
   * Demo service to show how to use the ProgressCalculationProvider
   * This would typically be used in a controller or other service
   */
  async submitAnswer(submitAnswerDto: SubmitAnswerDto) {
    return this.progressCalculationProvider.processAnswerSubmission(submitAnswerDto);
  }

  async getUserStats(userId: string, categoryId: string) {
    return this.progressCalculationProvider.getUserProgressStats(userId, categoryId);
  }

  /**
   * Direct access to validation methods for testing
   */
  validateAnswer(userAnswer: string, correctAnswer: string) {
    return this.progressCalculationProvider.validateAnswer(userAnswer, correctAnswer);
  }
}
