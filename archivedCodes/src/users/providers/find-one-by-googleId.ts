import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User } from '../user.entity';

/**
 * Service provider for finding a user by Google ID.
 */
@ApiTags('Users')
@Injectable()
export class FindOneByGoogleIdProvider {
  constructor(
    /**
     * Injects the User repository.
     */
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Finds a user by their Google ID.
   * @param googleId The Google ID of the user.
   * @returns The user entity if found, otherwise null.
   */
  @ApiOperation({ summary: 'Find a user by Google ID' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({ status: 404, description: 'User not found' })
  public async findOneByGoogleId(googleId: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ googleId });
  }
}