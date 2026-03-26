import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { UsersService } from '../providers/users.service';
import { XpLevelService } from '../providers/xp-level.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequireApiKey, RequireApiKeyScopes } from '../../api-keys/api-key.decorators';
import { ApiKeyScope } from '../../api-keys/api-key.entity';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly xpLevelService: XpLevelService,
  ) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200, description: 'User successfully deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string): Promise<{ message: string }> {
    await this.usersService.delete(id);
    return { message: `User with ID ${id} successfully deleted.` };
  }

  @Get(':id/xp-level')
  @ApiOperation({ summary: 'Get user XP and level' })
  @ApiResponse({
    status: 200,
    description: 'User XP and level retrieved successfully',
    schema: {
      example: {
        level: 12,
        xp: 2450,
        nextLevel: 3000,
      },
    },
  })
  async getUserXpLevel(@Param('id') id: string) {
    return this.xpLevelService.getUserXpLevel(id);
  }

  @Get()
  findAll(@Query() dto: paginationQueryDto) {
    return this.usersService.findAllUsers(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return id;
  }

  @Post()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: User,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() userData: CreateUserDto) {
    return this.usersService.create(userData);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'user successfully updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() editUserDto: EditUserDto) {
    return this.usersService.update(id, editUserDto);
  }

  @Get('api-keys/stats')
  @RequireApiKey()
  @ApiOperation({ summary: 'Get user statistics (requires API key)' })
  @ApiResponse({ status: 200, description: 'User stats retrieved' })
  async getUserStatsWithApiKey() {
    // This endpoint requires API key authentication
    return { message: 'This endpoint requires API key authentication' };
  }

  @Post('api-keys/admin-action')
  @RequireApiKeyScopes(ApiKeyScope.ADMIN)
  @ApiOperation({ summary: 'Admin action (requires admin API key scope)' })
  @ApiResponse({ status: 200, description: 'Admin action performed' })
  async adminActionWithApiKey() {
    // This endpoint requires API key with admin scope
    return { message: 'Admin action performed with API key' };
  }
}
