import { Injectable } from '@nestjs/common';

@Injectable()
export class VerifySolutionProvider {
  async execute(puzzleId: string, userAnswer: string): Promise<boolean> {
    // Check correctness
    return userAnswer.trim() === 'expected_answer';
  }
}
