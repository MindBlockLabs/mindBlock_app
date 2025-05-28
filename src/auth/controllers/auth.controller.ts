import { Controller, Post, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { LoginDto } from '../dtos/login.dto';
import { AuthService } from '../providers/auth.service';

@Controller('users')
export class AuthController {
  constructor(
    // injecting auth service
    private readonly authservice: AuthService,
) {}
@Post('/signIn')
@HttpCode(HttpStatus.OK)
public async SignIn(@Body() signInDto: LoginDto) {
   return await this.authservice.SignIn(signInDto)
}
@Post('/refreshToken')
@HttpCode(HttpStatus.OK)
public async refreshToken(@Body() refreshToken: RefreshToken) {
   return await this.authservice.refresh(refreshToken)
}
}
