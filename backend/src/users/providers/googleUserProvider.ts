import { ConflictException, Injectable } from '@nestjs/common';
import { GoogleInterface } from '../../auth/social/interfaces/user.interface';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User } from '../user.entity';

/**
 * Service responsible for creating Google users.
 */
@ApiTags('Google Users')
@Injectable()
export class CreateGoogleUserProvider {
  constructor(
    /**
     * Injects the User repository to handle database operations.
     */
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Creates a new Google user in the database.
   * @param googleUser - Google user details.
   * @returns The created user entity.
   * @throws ConflictException if user creation fails.
   */
  @ApiOperation({ summary: 'Create a new Google user' })
  @ApiResponse({ status: 201, description: 'User successfully created.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Could not create a new user.',
  })
  public async createGoogleUser(googleUser: GoogleInterface): Promise<User> {
    try {
      const user = this.userRepository.create(googleUser);
      return await this.userRepository.save(user);
    } catch (error) {
      throw new ConflictException(error, {
        description: 'Could not create a new user',
      });
    }
  }
}
