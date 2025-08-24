import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User } from '../user.entity';
import { PaginationProvider } from '../../common/pagination/provider/pagination-provider';
import { PaginatedInterface } from '../../common/pagination/paginatedInterfaces';
import { paginationQueryDto } from 'src/common/pagination/paginationQueryDto';
/**
 * Service for finding a user by email.
 */
@ApiTags('Users')
@Injectable()
export class FindAll {
  /**
   * Injects the User repository.
   * @param userRepository - The repository for User entity.
   */
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  /**
   * Finds all users
   * @param dto - The pagination dto to find all users.
   * @returns Paginated users list.
   * @throws RequestTimeoutException if there is an error connecting to the database.
   */
  @ApiOperation({ summary: 'Find all users' })
  @ApiResponse({
    status: 408,
    description: 'Request Timeout - Could not fetch user',
  })
  public async findAll(
    dto: paginationQueryDto,
  ): Promise<PaginatedInterface<User>> {
    let users: PaginatedInterface<User>;

    try {
      users = await this.paginationProvider.qpaginatedQuer(
        dto,
        this.userRepository,
      );

      // users = await this.userRepository.find();
    } catch (error) {
      throw new RequestTimeoutException('Could not fetch users', {
        description: 'Error connecting to database',
      });
    }

    return users;
  }
}
