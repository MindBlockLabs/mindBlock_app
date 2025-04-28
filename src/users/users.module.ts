import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './providers/users.service';
import { UsersController } from './controllers/users.controller';
import { FindOneByEmail } from './providers/find-one-by-email.provider';
import { User } from './user.entity';
import { AuthModule } from 'src/auth/auth.module';
import { CreateUserService } from './providers/create-user.service';
import { DeleteUserService } from './providers/delete-user.service';
import { FindOneByGoogleIdProvider } from './providers/find-one-by-googleId';
import { CreateGoogleUserProvider } from './providers/googleUserProvider';

@Module({
  imports: [forwardRef(() => AuthModule), TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService,  CreateUserService, FindOneByEmail, DeleteUserService, FindOneByGoogleIdProvider, CreateGoogleUserProvider],
  exports: [UsersService], // Make service reusable
})

@Module({})
export class UsersModule {}
