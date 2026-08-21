import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Body,
  Get,
  Query,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LoginDto } from '../dtos/login.dto';
import { AuthService } from '../providers/auth.service';
import { RefreshTokenDto } from '../dtos/refreshTokenDto';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NonceResponseDto } from '../dtos/nonceResponse.dto';
import { StellarWalletLoginDto } from '../dtos/walletLogin.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { ActiveUser } from '../decorators/activeUser.decorator';
import { ActiveUserData } from '../interfaces/activeInterface';

import { GuestSessionProvider } from '../providers/guest-session.provider';
import { ConvertGuestDto } from '../dtos/convert-guest.dto';

@Controller('auth')
export class AuthController {
  constructor(
    // injecting auth service & guest session provider
    private readonly authservice: AuthService,
    private readonly guestSessionProvider: GuestSessionProvider,
  ) {}

  @Post('/guest-session')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new 15-minute guest session' })
  @ApiResponse({ status: 201, description: 'Guest session created successfully' })
  public createGuestSession() {
    return this.guestSessionProvider.createGuestSession();
  }

  @Get('/guest-session/:sessionId/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check guest session status and expiration' })
  @ApiResponse({ status: 200, description: 'Guest session status retrieved' })
  public checkGuestSessionStatus(@Param('sessionId') sessionId: string) {
    return this.guestSessionProvider.getGuestSessionStatus(sessionId);
  }

  @Post('/guest-session/:sessionId/hint')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request hint for guest session (max 2 allowed)' })
  @ApiResponse({ status: 200, description: 'Hint usage validated' })
  @ApiResponse({ status: 403, description: 'Hint limit reached' })
  public requestGuestHint(@Param('sessionId') sessionId: string) {
    return this.guestSessionProvider.validateGuestHintUsage(sessionId);
  }

  @Post('/convert-guest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert guest session into an authenticated account' })
  @ApiResponse({ status: 200, description: 'Guest converted to account' })
  public convertGuestAccount(@Body() dto: ConvertGuestDto) {
    return this.guestSessionProvider.convertGuestToAccount(dto);
  }

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
  public async resetPassword(
    @Param('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return await this.authservice.resetPassword(token, resetPasswordDto);
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current user and invalidate session' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  @ApiResponse({ status: 401, description: 'Invalid or missing refresh token' })
  public async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authservice.logout(refreshTokenDto);
  }

  @Post('/logout-all')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'All sessions invalidated' })
  public async logoutAll(@ActiveUser() user: ActiveUserData) {
    return await this.authservice.logoutAll(user.sub);
  }

  @Get('/me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user data retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  public async getCurrentUser(@ActiveUser() user: ActiveUserData) {
    return await this.authservice.getCurrentUser(user.sub);
  }
}