import { Injectable } from '@nestjs/common';
import { SubmitPuzzleProvider } from '../providers/submit-puzzle.provider';

@Injectable()
export class BlockchainService {
  constructor(private readonly submitPuzzleProvider: SubmitPuzzleProvider) {}

  async submitPuzzleOnChain(
    stellarWallet: string,
    puzzleId: string,
    category: string,
    score: number,
  ): Promise<void> {
    return this.submitPuzzleProvider.submitPuzzleOnChain(
      stellarWallet,
      puzzleId,
      category,
      score,
    );
  }

  getHello(): string {
    return 'Hello from Blockchain Service';
  }
}
