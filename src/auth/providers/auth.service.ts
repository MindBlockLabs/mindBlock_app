import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from 'src/users/dtos/create-user.dto';
import { GenerateTokensProvider } from './generate-tokens.provider';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly generateTokensProvider: GenerateTokensProvider,
  ) {}

  /** Registers a new user (local signup) */
  async register(dto: CreateUserDto) {
    // UsersService.create() already hashes the password
    const newUser = await this.usersService.create(dto);
    const tokens = await this.generateTokensProvider.generateTokens(newUser);
    return { user: newUser, tokens };
  }

  /** Validates credentials and returns tokens */
  async login(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'User registered via OAuth; please log in with Google',
      );
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokensProvider.generateTokens(user);
    return { user, tokens };
  }

  /** (Optional) Validate JWT payload for Guards: returns ActiveUserData */
  async validateUserPayload(payload: {
    sub: number;
    username: string;
    email: string;
  }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      sub: user.id,
      email: user.email,
      username: user.username,
    };
  }
}
