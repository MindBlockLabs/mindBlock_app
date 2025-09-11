import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Get,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LoginDto } from '../dtos/login.dto';
import { AuthService } from '../providers/auth.service';
import { RefreshTokenDto } from '../dtos/refreshTokenDto';
import { WalletLoginDto } from '../dtos/walletLogin.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NonceResponseDto } from '../dtos/nonceResponse.dto';

@Controller('auth')
export class AuthController {
  constructor(
    // injecting auth service
    private readonly authservice: AuthService,
  ) {}
  @Post('/signIn')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ status: 200, description: 'Successfully signed in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  public async SignIn(@Body() signInDto: LoginDto) {
    return await this.authservice.SignIn(signInDto);
  }

  @Post('/refreshToken')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Access token refreshed successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired refresh token' })
  public async refreshToken(@Body() refreshToken: RefreshTokenDto) {
    return await this.authservice.refreshToken(refreshToken);
  }

  @Post('/wallet-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Starknet wallet' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in with wallet',
  })
  @ApiResponse({ status: 401, description: 'Invalid wallet or signature' })
  public async WalletLogin(@Body() dto: WalletLoginDto) {
    return await this.authservice.WalletLogin(dto);
  }

  @Get('/wallet-nonce')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate nonce for wallet authentication',
    description:
      'Generates a unique nonce that must be signed by the wallet for authentication',
  })
  @ApiResponse({
    status: 200,
    description: 'Nonce generated successfully',
    type: NonceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid wallet address',
  })
  public async generateWalletNonce(
    @Query('walletAddress') walletAddress: string,
  ): Promise<NonceResponseDto> {
    return await this.authservice.generateNonce(walletAddress);
  }

  @Get('/wallet-nonce/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check nonce status',
    description: 'Check if a nonce is valid and not expired',
  })
  @ApiResponse({
    status: 200,
    description: 'Nonce status retrieved',
  })
  public async checkNonceStatus(@Query('nonce') nonce: string) {
    return await this.authservice.checkNonceStatus(nonce);
  }
}
