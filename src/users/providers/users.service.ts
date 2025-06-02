import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserProfileDto } from './dtos/update-user-profile.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /** Creates a new user, hashing the password */
  async create(dto: CreateUserDto): Promise<User> {
    // Check uniqueness of username/email
    const exists = await this.userRepository.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });
    if (exists) {
      throw new ConflictException('Username or email already in use.');
    }

    // Hash password if provided
    let hashedPassword: string | null = null;
    if (dto.password) {
      hashedPassword = await bcrypt.hash(dto.password, 10);
    }

    const user = this.userRepository.create({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
      userRole: dto.userRole,
      googleId: dto.googleId,
    });

    return this.userRepository.save(user);
  }

  /** Finds a user by ID */
  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /** Finds a user by username */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  /** Finds a user by email */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /** Finds a user by Google ID */
  async findOneByGoogleId(googleId: string | number): Promise<User | null> {
    return this.userRepository.findOne({ where: { googleId: `${googleId}` } });
  }

  /** Updates a user's profile */
  async updateProfile(
    id: number,
    dto: UpdateUserProfileDto,
  ): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }

    if (dto.username) {
      // Ensure new username is unique
      const conflict = await this.findByUsername(dto.username);
      if (conflict && conflict.id !== id) {
        throw new ConflictException('Username is already taken.');
      }
      user.username = dto.username;
    }

    if (dto.avatar !== undefined) {
      (user as any).avatar = dto.avatar;
    }

    return this.userRepository.save(user);
  }
}
