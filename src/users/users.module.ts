import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './providers/users.service';
import { UsersController } from './controllers/users.controller';

@Module({
  imports: [TypeOrmModule.forFeature()], // Register Repository
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Make service reusable
})

@Module({})
export class UsersModule {}
