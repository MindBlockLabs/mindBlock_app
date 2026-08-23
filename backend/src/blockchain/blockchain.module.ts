import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import stellarConfig from '../config/stellar.config';
import { BlockchainController } from './controller/blockchain.controller';
import { BlockchainService } from './provider/blockchain.service';

/**
 * Registers the blockchain providers and exports BlockchainService so any
 * importing module (ProgressModule, UsersModule, QuestsModule, ...) can
 * inject it to trigger on-chain actions.
 *
 * STELLAR_SECRET_KEY, STELLAR_CONTRACT_ID, STELLAR_RPC_URL and
 * STELLAR_NETWORK_PASSPHRASE are exposed through the namespaced
 * `stellar` configuration registered below (see src/config/stellar.config.ts).
 */
@Module({
  imports: [ConfigModule.forFeature(stellarConfig)],
  controllers: [BlockchainController],
  providers: [
    // On-chain action providers land with issues 11-14:
    //   RegisterPlayerProvider, SubmitPuzzleProvider, GetPlayerProvider,
    //   SyncXpMilestoneProvider. Each must be added to this array (and the
    //   matching method on BlockchainService) as soon as it is merged so
    //   they are injectable alongside BlockchainService.
    BlockchainService,
  ],
  exports: [BlockchainService],
})
export class BlockchainModule {}
