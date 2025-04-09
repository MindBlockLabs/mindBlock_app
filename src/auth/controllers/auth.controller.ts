import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { LoginDto } from '../dtos/login.dto';
import { AuthService } from '../providers/auth.service';

@Controller('users')
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ) {}

  @Post('/signIn')
  public async SignIn(@Body() signInDto: LoginDto) {
    return await this.authService.login(signInDto)
 }
//  @Post('/refreshToken')
//  public RefreshToken(@Body() refreshToken: RefreshTokenDto) {
//      return this.authService.refreshToken(refreshToken)
//  }
}
