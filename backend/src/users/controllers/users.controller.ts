import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../providers/users.service';
import { XpLevelService } from '../providers/xp-level.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { paginationQueryDto } from '../../common/pagination/paginationQueryDto';
import { EditUserDto } from '../dtos/editUserDto.dto';
import { CreateUserDto } from '../dtos/createUserDto';
import { User } from '../user.entity';
import { RolesGuard } from '../../roles/roles.guard';
import { Roles } from '../../roles/roles.decorator';
import { userRole } from '../enums/userRole.enum';

@Controller('users')
@ApiTags('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly xpLevelService: XpLevelService,
  ) {}

  @Delete(':id')
  @Roles(userRole.ADMIN)
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
  @Roles(userRole.ADMIN, userRole.MODERATOR)
  findAll(@Query() dto: paginationQueryDto) {
    return this.usersService.findAllUsers(dto);
  }

  @Get(':id')
  @Roles({ roles: [userRole.ADMIN, userRole.MODERATOR], ownership: { param: 'id' } })
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
  @Roles({ roles: [userRole.ADMIN], ownership: { param: 'id' } })
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'user successfully updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() editUserDto: EditUserDto) {
    return this.usersService.update(id, editUserDto);
  }
}
