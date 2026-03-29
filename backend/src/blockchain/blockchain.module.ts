import { Module } from '@nestjs/common';
import { BlockchainController } from './controller/blockchain.controller';
import { BlockchainService } from './provider/blockchain.service';
import { GetPlayerProvider } from './providers/get-player.provider';
import { RegisterPlayerProvider } from './providers/register-player.provider';
import { SyncXpMilestoneProvider } from './providers/sync-xp-milestone.provider';

@Module({
  controllers: [BlockchainController],
  providers: [
    BlockchainService,
    GetPlayerProvider,
    RegisterPlayerProvider,
    SyncXpMilestoneProvider,
  ],
  exports: [BlockchainService],
})
export class BlockchainModule {}
