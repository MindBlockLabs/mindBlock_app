import { Injectable } from '@nestjs/common';

@Injectable()
export class GetPuzzleProvider {
  async execute(puzzleId: string): Promise<any> {
    // Fetch puzzle by ID
    return { id: puzzleId, question: 'What is 2 + 2?' };
  }
}