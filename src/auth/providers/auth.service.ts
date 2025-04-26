import { Injectable, Inject } from '@nestjs/common';
import { forwardRef } from '@nestjs/common';
import { LoginDto } from '../dtos/login.dto';
import { UsersService } from 'src/users/providers/users.service';
import { SignInProvider } from './sign-in.provider';

interface OAuthUser {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    // injecting user service
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,

    // inject signInProvider
    private readonly signInProvider: SignInProvider,
) {}

public async SignIn(signInDto: LoginDto) {
    return await this.signInProvider.SignIn(signInDto)
}

public isAuth() {
    return true
}    
}
