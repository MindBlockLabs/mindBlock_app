import { Controller, Post, HttpCode, HttpStatus, Body } from '@nestjs/common';
import { LoginDto } from '../dtos/login.dto';
import { AuthService } from '../providers/auth.service';
import { RefreshTokenDto } from '../dtos/refreshTokenDto';

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
  ) {}
  @Post('/signIn')
  // @Auth(authTypes.None)
  @HttpCode(HttpStatus.OK)
  public async SignIn(@Body() signInDto: LoginDto) {
    return await this.authservice.SignIn(signInDto);
  }

  @Post('/refreshToken')
    /**refreshtoken class */
    public RefreshToken(@Body() refreshToken: RefreshTokenDto) {
        return this.authservice.refreshToken(refreshToken)
    }
}
