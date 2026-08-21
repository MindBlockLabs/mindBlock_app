import {
  forwardRef,
  Inject,
  Injectable,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { UsersService } from '../../users/providers/users.service';
import { HashingProvider } from './hashing.provider';
import jwtConfig from '../authConfig/jwt.config';
import { LoginDto } from '../dtos/login.dto';
import { SessionsProvider } from './sessions.provider';

@Injectable()
export class SignInProvider {
  constructor(
    // injecting userService repo
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService,

    // injecting hashing dependency
    private readonly hashingProvider: HashingProvider,

    // inject jwt configuration
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,

    // inject sessions provider for secure session management
    private readonly sessionsProvider: SessionsProvider,
  ) {}
  public async SignIn(signInDto: LoginDto, deviceInfo?: string, ipAddress?: string) {
    // check if user exist in db
    // throw error if user doesnt exist
    const user = await this.userService.GetOneByEmail(signInDto.email);

    // compare password
    let isCheckedPassword: boolean = false;

    try {
      if (!user.password) {
        throw new UnauthorizedException('Email or password is incorrect');
      }
      isCheckedPassword = await this.hashingProvider.comparePasswords(
        signInDto.password,
        user.password,
      );
    } catch (error) {
      throw new RequestTimeoutException(error, {
        description: 'error connecting to the database',
      });
    }

    if (!isCheckedPassword) {
      throw new UnauthorizedException('email or password is incorrect');
    }

    // Create a new secure session with access and refresh tokens
    return await this.sessionsProvider.createSession(user, deviceInfo, ipAddress);
  }
}