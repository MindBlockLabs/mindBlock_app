import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../providers/auth.service';

@Controller('auth/social')
export class SocialController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // This endpoint initiates the Google OAuth flow
    // The actual implementation is handled by the GoogleStrategy
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req) {
    // This endpoint handles the callback from Google
    // The user object and token are attached to the request by the GoogleStrategy
    return {
      user: req.user.user,
      token: req.user.token,
    };
  }
}
