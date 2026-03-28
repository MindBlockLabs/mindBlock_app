import { Module } from '@nestjs/common';
import { BlockchainController } from './controller/blockchain.controller';
import { BlockchainService } from './provider/blockchain.service';
import { GetPlayerProvider } from './providers/get-player.provider';

@Module({
  controllers: [BlockchainController],
  providers: [BlockchainService, GetPlayerProvider],
  exports: [BlockchainService],
})
export class BlockchainModule {}
