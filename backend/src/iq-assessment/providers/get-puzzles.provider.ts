import { Injectable } from '@nestjs/common';

@Injectable()
export class GetPuzzlesProvider {
  async execute(category?: string): Promise<any[]> {
    // Fetch list of puzzles
    return [
      { id: '1', question: 'What is 2 + 2?' },
      { id: '2', question: 'What is the capital of France?' },
    ];
  }
}
