import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';

@Controller('users')
export class AuthController {
  constructor() {}

  @Get()
  findAll() {
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return null;
  }

  @Post()
  create(@Body() data: any) {
    return {};
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
