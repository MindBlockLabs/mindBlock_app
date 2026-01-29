import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { isEmail } from 'class-validator';
import { CreateUserDto } from '../dtos/createUserDto';
import { HashingProvider } from '../../auth/providers/hashing.provider';

@Injectable()
export class CreateUserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    // injecting hashing dependency
    private readonly hashingProvider: HashingProvider,
  ) {}

  async execute(userData: CreateUserDto): Promise<User> {
    // 1. Validation
    const isWalletUser = userData.provider === 'wallet';

    if (!isWalletUser) {
      if (!userData.email || !isEmail(userData.email)) {
        throw new BadRequestException('Invalid email');
      }

      // 2. Check for existing user (only if email is provided)
      const exists = await this.usersRepository.findOneBy({
        email: userData.email,
      });
      if (exists) {
        throw new BadRequestException('Email already in use');
      }
    }

    // 3. Create and save user
    try {
      // hash the password before saving (only if provided)
      if (userData.password) {
        if (typeof userData.password !== 'string') {
          throw new BadRequestException('Password must be a string');
        }
        const hashedPassword = await this.hashingProvider.hashPassword(
          userData.password,
        );
        userData.password = hashedPassword;
      }

      // Ensure fullname is never null (required by DB)
      if (!userData.fullname) {
        userData.fullname = userData.username || 'Anonymous User';
      }

      const user = this.usersRepository.create(userData);
      const savedUser = await this.usersRepository.save(user);

      if (Array.isArray(savedUser)) {
        throw new InternalServerErrorException(
          'Unexpected array response while saving user',
        );
      }
      return savedUser;
    } catch (error) {
      throw new InternalServerErrorException(`Failed to create user: ${error}`);
    }
  }
}
