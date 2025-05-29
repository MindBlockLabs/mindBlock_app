// src/users/controllers/users.controller.ts

import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { UsersService } from '../providers/users.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService
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
  findAll() {
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return null;
  }

  @Post()
  async create(@Body() userData: any) {
    return this.usersService.create(userData);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return {};
  }
}
