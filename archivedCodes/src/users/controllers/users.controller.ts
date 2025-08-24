// src/users/controllers/users.controller.ts

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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { paginationQueryDto } from 'src/common/pagination/paginationQueryDto';
import { EditUserDto } from '../dtos/editUserDto.dto';
import { UserActivityService } from '../providers/UserActivityService';
import { UserActivityResponseDto } from '../dtos/user-activity-response.dto';
import { ParseIntPipe, DefaultValuePipe, ValidationPipe } from '@nestjs/common';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userActivityService: UserActivityService,
  ) {}

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200, description: 'User successfully deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string): Promise<{ message: string }> {
    await this.usersService.delete(id);
    return { message: `User with ID ${id} successfully deleted.` };
  }

  @Get()
  findAll(@Query() dto: paginationQueryDto) {
    return this.usersService.findAllUsers(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return null;
  }

  @Post()
  async create(@Body() userData: any) {
    return this.usersService.create(userData);
  }

  @Patch(':id')
  @ApiOperation({summary: "Update user by ID"})
  @ApiResponse({status: 200, description: "user successfully updated"})
  @ApiResponse({status: 404, description: "User not found"})
  async update(@Param('id') id: string, @Body() editUserDto: EditUserDto) {
    return this.usersService.update(id,editUserDto);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Get recent activity for a user' })
  @ApiResponse({ status: 200, type: UserActivityResponseDto })
  async getUserActivity(
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ): Promise<UserActivityResponseDto> {
    if (page < 1 || limit < 1) {
      throw new Error('Page and limit must be positive integers');
    }
    const activities = await this.userActivityService.getUserActivity(id, page, limit);
    return { activities };
  }
}
