import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainController } from './controller/blockchain.controller';
import { BlockchainService } from './provider/blockchain.service';
import { SubmitPuzzleProvider } from './providers/submit-puzzle.provider';
import { GetPlayerProvider } from './providers/get-player.provider';

@Module({
  imports: [ConfigModule],
  controllers: [BlockchainController],
  providers: [BlockchainService, SubmitPuzzleProvider],
  providers: [BlockchainService, GetPlayerProvider],
  exports: [BlockchainService],
})
export class BlockchainModule {}
