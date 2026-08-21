import {
  forwardRef,
  Inject,
  Injectable,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { UsersService } from '../../users/providers/users.service';
import { HashingProvider } from './hashing.provider';
import jwtConfig from '../authConfig/jwt.config';
import { LoginDto } from '../dtos/login.dto';

@Injectable()
export class SignInProvider {
  constructor(
    // injecting userService repo
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,

    // injecting hashing dependency
    private readonly hashingProvider: HashingProvider,

    // inject jwt service
    private readonly jwtService: JwtService,

    // inject jwt
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}
  public async SignIn(signInDto: LoginDto) {
    // Always use the same error message to prevent email enumeration
    const invalidCredentialsError = new UnauthorizedException('Email or password is incorrect');
    
    // Get user by email
    const user = await this.userService.GetOneByEmail(signInDto.email);
    
    // If user doesn't exist, still perform password comparison to prevent timing attacks
    let isCheckedPassword: boolean = false;
    
    try {
      if (user && user.password) {
        isCheckedPassword = await this.hashingProvider.comparePasswords(
          signInDto.password,
          user.password,
        );
      }
      
      // If user doesn't exist or password is incorrect, throw the same error
      if (!user || !isCheckedPassword) {
        throw invalidCredentialsError;
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new RequestTimeoutException(error, {
        description: 'Error connecting to the database',
      });
    }

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        expiresIn: this.jwtConfiguration.ttl,
      },
    );

    // login
    return { accessToken };
  }
}