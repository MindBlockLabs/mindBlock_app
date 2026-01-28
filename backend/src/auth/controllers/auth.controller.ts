import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LoginDto } from '../dtos/login.dto';
import { AuthService } from '../providers/auth.service';
import { RefreshTokenDto } from '../dtos/refreshTokenDto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NonceResponseDto } from '../dtos/nonceResponse.dto';
import { StellarWalletLoginDto } from '../dtos/walletLogin.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';

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
          description: 'JWT access token for authenticated user',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid wallet signature or authentication failed',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request format or expired nonce',
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
  public generateStellarWalletNonce(
    @Query('walletAddress') walletAddress: string,
  ): NonceResponseDto {
    return this.authservice.generateNonce(walletAddress);
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
          description: 'Whether the nonce is valid',
        },
        reason: {
          type: 'string',
          description: 'Reason if nonce is invalid',
        },
        walletAddress: {
          type: 'string',
          description: 'Associated wallet address (only if valid)',
        },
        expiresAt: {
          type: 'number',
          description: 'Expiration timestamp (only if valid)',
        },
      },
    },
  })
  public checkNonceStatus(@Query('nonce') nonce: string) {
    return this.authservice.checkNonceStatus(nonce);
  }
  @Post('/forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Sends a password reset email if the account exists',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent (or message returned for security)',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'If an account with that email exists, a password reset link has been sent.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email format',
  })
  public async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authservice.forgotPassword(forgotPasswordDto);
  }

  @Post('/reset-password/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with token',
    description: 'Resets user password using the token from email',
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password has been reset successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired token',
  })
  public async resetPassword(
    @Param('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return await this.authservice.resetPassword(token, resetPasswordDto);
  }
}
