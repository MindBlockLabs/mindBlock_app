import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainController } from './controller/blockchain.controller';
import { BlockchainService } from './provider/blockchain.service';
import { SubmitPuzzleProvider } from './providers/submit-puzzle.provider';

@Module({
  imports: [ConfigModule],
  controllers: [BlockchainController],
  providers: [BlockchainService, SubmitPuzzleProvider],
  exports: [BlockchainService],
})
export class BlockchainModule {}
