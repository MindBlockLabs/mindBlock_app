import { Controller, Get } from '@nestjs/common';
import { BlockchainService } from '../provider/blockchain.service';

@Controller('blockchain')
export class BlockchainController {
    constructor(private readonly blockchainService: BlockchainService) {}

    @Get()
    getHello(): string {
      // Call a simple method in the service
      return this.blockchainService.getHello();
    }
}
