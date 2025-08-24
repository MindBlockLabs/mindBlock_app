import { Injectable } from '@nestjs/common';

@Injectable()
export class UpdateProgressProvider {
  async execute(userId: string, puzzleId: string, correct: boolean): Promise<void> {
    // Update progress tracking
  }
}