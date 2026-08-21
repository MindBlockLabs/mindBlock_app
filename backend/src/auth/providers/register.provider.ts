import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { RegisterDto } from '../dtos/register.dto';
import { CreateUserService } from '../../users/providers/create-user.service';
import { GenerateTokensProvider } from './generate-tokens.provider';
import { User } from '../../users/user.entity';

@Injectable()
export class RegisterProvider {
  private readonly logger = new Logger(RegisterProvider.name);

  constructor(
    private readonly createUserService: CreateUserService,
    private readonly generateTokensProvider: GenerateTokensProvider,
  ) {}

  public async register(registerDto: RegisterDto) {
    this.logger.log(`Registration attempt for email: ${registerDto.email}`);
    
    try {
      // Create the user
      const user = await this.createUserService.execute({
        email: registerDto.email,
        username: registerDto.username,
        fullname: registerDto.fullname || registerDto.username,
        password: registerDto.password,
        provider: 'email',
      });

      this.logger.log(`User registered successfully: ${user.id} (${user.email})`);

      // Generate authentication tokens
      const tokens = await this.generateTokensProvider.generateTokens(user);

      // Return user data (without password) and tokens
      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullname: user.fullname,
          xp: user.xp,
          level: user.level,
        },
        ...tokens,
      };
    } catch (error) {
      this.logger.error(`Registration failed for ${registerDto.email}: ${error.message}`);
      throw error;
    }
  }
}