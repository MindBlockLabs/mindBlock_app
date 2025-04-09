import { Module } from '@nestjs/common';
import { BlockchainController } from './controller/blockchain.controller';
import { BlockchainService } from './provider/blockchain.service';

@Module({
  controllers: [BlockchainController],
  providers: [BlockchainService],
  exports: [BlockchainService]
})
export class BlockchainModule {}
