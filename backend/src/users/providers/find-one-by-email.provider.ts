import {
  Injectable,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User } from '../user.entity';

/**
 * Service for finding a user by email.
 */
@ApiTags('Users')
@Injectable()
export class FindOneByEmail {
  /**
   * Injects the User repository.
   * @param userRepository - The repository for User entity.
   */
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  /**
   * Finds a user by email.
   * @param email - The email of the user to find.
   * @returns The user entity if found.
   * @throws RequestTimeoutException if there is an error connecting to the database.
   * @throws UnauthorizedException if the user does not exist.
   */
  @ApiOperation({ summary: 'Find a user by email' })
  @ApiResponse({ status: 200, description: 'User found', type: User })
  @ApiResponse({
    status: 408,
    description: 'Request Timeout - Could not fetch user',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User does not exist',
  })
  public async findOneByEmail(email: string): Promise<User> {
    let user: User | null;

    try {
      user = await this.userRepository.findOneBy({ email });
    } catch (error) {
      throw new RequestTimeoutException('Could not fetch user', {
        description: `Error connecting to database ${error}`,
      });
    }

    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }

    return user;
  }
}
