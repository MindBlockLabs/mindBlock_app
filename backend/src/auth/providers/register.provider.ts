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
      // Validate password confirmation
      if (registerDto.password !== registerDto.passwordConfirm) {
        this.logger.warn(`Registration failed: Passwords do not match for ${registerDto.email}`);
        throw new BadRequestException('Passwords do not match');
      }

      // Create the user
      const user = await this.createUserService.execute({
        email: registerDto.email,
        username: registerDto.username,
        fullname: registerDto.fullname || registerDto.username,
        password: registerDto.password,
        provider: 'email',
        challengeLevel: undefined,
        challengeTypes: undefined,
        ageGroup: undefined,
      });

      this.logger.log(`User registered successfully: ${user.id} (${user.email})`);

      // Generate authentication tokens
      return await this.generateTokensProvider.generateTokens(user);
    } catch (error) {
      this.logger.error(`Registration failed for ${registerDto.email}: ${error.message}`);
      throw error;
    }
  }
}