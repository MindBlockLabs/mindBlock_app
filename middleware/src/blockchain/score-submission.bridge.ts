import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../auth/rbac.middleware';
import { BlockchainService } from './blockchain.service';

export interface TrustedScorePayload {
  stellarWallet: string;
  puzzleId: string;
  categoryId: string;
  /** Normalized 0–100 score */
  score: number;
  submittedBy: string;
  submitterRole: UserRole;
}

export interface TrustedScoreResult {
  success: boolean;
  stellarWallet: string;
  puzzleId: string;
}

/**
 * ScoreSubmissionBridge — Issue #301
 *
 * Bridges the backend score verification layer and the Stellar smart contract.
 * Only ORACLE or ADMIN roles may submit trusted scores on-chain.
 *
 * Usage:
 *   await this.scoreSubmissionBridge.submitTrustedScore({
 *     stellarWallet, puzzleId, categoryId, score,
 *     submittedBy: req.user.sub,
 *     submitterRole: req.user.userRole,
 *   });
 */
@Injectable()
export class ScoreSubmissionBridge {
  private readonly logger = new Logger(ScoreSubmissionBridge.name);

  constructor(private readonly blockchainService: BlockchainService) {}

  async submitTrustedScore(payload: TrustedScorePayload): Promise<TrustedScoreResult> {
    const { stellarWallet, puzzleId, categoryId, score, submittedBy, submitterRole } = payload;

    if (submitterRole !== UserRole.ORACLE && submitterRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only ORACLE or ADMIN roles may submit trusted scores.');
    }

    if (score < 0 || score > 100) {
      throw new Error(`Score must be 0–100, received ${score}`);
    }

    this.logger.log(
      `Trusted score: ${submittedBy} (${submitterRole}) → wallet=${stellarWallet} puzzle=${puzzleId} score=${score}`,
    );

    await this.blockchainService.submitPuzzleOnChain(stellarWallet, puzzleId, categoryId, score);

    return { success: true, stellarWallet, puzzleId };
  }
}
