import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BlockchainService } from '../provider/blockchain.service';
import { LinkWalletDto } from '../dtos/link-wallet.dto';

@ApiTags('Blockchain')
@Controller('blockchain')
export class BlockchainController {
  constructor(private readonly blockchainService: BlockchainService) {}

  @Get()
  getHello(): string {
    return this.blockchainService.getHello();
  }

  @Post('wallet/link')
  @ApiOperation({ summary: 'Link a Stellar wallet to user account' })
  @ApiResponse({ status: 200, description: 'Wallet successfully linked' })
  @ApiResponse({ status: 400, description: 'Invalid wallet address' })
  async linkWallet(@Body() dto: LinkWalletDto, @Req() req: any) {
    const userId = req.user?.sub || req.user?.id || 'anonymous';
    return this.blockchainService.linkWallet(userId, dto.walletAddress);
  }
}
