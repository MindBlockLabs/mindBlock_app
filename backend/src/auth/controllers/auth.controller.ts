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
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NonceResponseDto } from '../dtos/nonceResponse.dto';
import { StellarWalletLoginDto } from '../dtos/walletLogin.dto';

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

  @Post('/stellar-wallet-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Stellar wallet' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in with Stellar wallet',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          description: 'JWT access token for authenticated user'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid wallet signature or authentication failed' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid request format or expired nonce' 
  })
  public async stellarWalletLogin(@Body() dto: StellarWalletLoginDto) {
    return await this.authservice.StellarWalletLogin(dto);
  }

  @Get('/stellar-wallet-nonce')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate nonce for Stellar wallet authentication',
    description:
      'Generates a unique nonce that must be signed by the Stellar wallet for authentication. The nonce expires in 5 minutes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Nonce generated successfully',
    type: NonceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid Stellar wallet address format',
  })
  public async generateStellarWalletNonce(
    @Query('walletAddress') walletAddress: string,
  ): Promise<NonceResponseDto> {
    return await this.authservice.generateNonce(walletAddress);
  }

  @Get('/stellar-wallet-nonce/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check nonce status',
    description: 'Check if a nonce is valid, not expired, and not already used',
  })
  @ApiResponse({
    status: 200,
    description: 'Nonce status retrieved',
    schema: {
      type: 'object',
      properties: {
        valid: {
          type: 'boolean',
          description: 'Whether the nonce is valid'
        },
        reason: {
          type: 'string',
          description: 'Reason if nonce is invalid'
        },
        walletAddress: {
          type: 'string',
          description: 'Associated wallet address (only if valid)'
        },
        expiresAt: {
          type: 'number',
          description: 'Expiration timestamp (only if valid)'
        }
      }
    }
  })
  public async checkNonceStatus(@Query('nonce') nonce: string) {
    return await this.authservice.checkNonceStatus(nonce);
  }
}