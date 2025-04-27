import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { UsersService } from '../providers/users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService
  ) {}

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

  @Delete(':id')
  delete(@Param('id') id: string) {
    return { deleted: true };
  }
}
