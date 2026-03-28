import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { GetPlayerProvider } from './providers/get-player.provider';
import { RegisterPlayerProvider } from './providers/register-player.provider';
import { SubmitPuzzleProvider } from './providers/submit-puzzle.provider';
import { SyncXpMilestoneProvider } from './providers/sync-xp-milestone.provider';
import { SyncStreakProvider } from './providers/sync-streak.provider';
import { ScoreSubmissionBridge } from './score-submission.bridge';

/**
 * BlockchainModule — Issue #307
 *
 * Registers all four Soroban contract providers and exports BlockchainService
 * so it is injectable across every dependent module:
 *   - ProgressModule  → submitPuzzleOnChain after correct answer (Issue #309)
 *   - UsersModule     → registerPlayerOnChain after wallet link (Issue #308)
 *   - QuestsModule    → syncXpMilestone after daily quest level-up (Issue #309)
 *   - StreakModule     → syncStreakOnChain after streak update (Issue #310)
 *
 * Usage in dependent modules:
 *   imports: [BlockchainModule]          ← import the module
 *   // DO NOT add BlockchainService to providers — it is exported by this module
 *
 * Required environment variables (accessed via ConfigModule):
 *   STELLAR_SECRET_KEY
 *   STELLAR_CONTRACT_ID
 *   STELLAR_RPC_URL
 *   STELLAR_NETWORK_PASSPHRASE
 *   STREAK_SYNC_ENABLED
 */
@Module({
  imports: [ConfigModule],
  providers: [
    BlockchainService,
    GetPlayerProvider,
    RegisterPlayerProvider,
    SubmitPuzzleProvider,
    SyncXpMilestoneProvider,
    SyncStreakProvider,
    ScoreSubmissionBridge,
  ],
  exports: [BlockchainService, ScoreSubmissionBridge],
})
export class BlockchainModule {}
