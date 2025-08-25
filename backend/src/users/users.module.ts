import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './providers/users.service';
import { UsersController } from './controllers/users.controller';
import { FindOneByEmail } from './providers/find-one-by-email.provider';
import { User } from './user.entity';
import { AuthModule } from '../auth/auth.module';
import { CreateUserService } from './providers/create-user.service';
import { DeleteUserService } from './providers/delete-user.service';
import { FindAll } from './providers/find-all.service';
import { FindOneByGoogleIdProvider } from './providers/find-one-by-googleId';
import { CreateGoogleUserProvider } from './providers/googleUserProvider';
import { PaginationModule } from '../common/pagination/pagination.module';
import { FindOneByWallet } from './providers/find-one-by-wallet.provider';
import { UpdateUserService } from './providers/update-user.service';
import { PuzzleActivityProvider } from './providers/PuzzleActivityProvider';
import { UserActivityService } from './providers/UserActivityService';
import { PuzzleSubmission } from '../puzzle/entities/puzzle-submission.entity';
import { UserAchievement } from '../achievement/entities/user-achievement.entity';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([User, PuzzleSubmission, UserAchievement]),
    PaginationModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    CreateUserService,
    FindOneByEmail,
    FindOneByWallet,
    FindAll,
    DeleteUserService,
    FindOneByGoogleIdProvider,
    CreateGoogleUserProvider,
    UpdateUserService,
    PuzzleActivityProvider,
    UserActivityService,
  ],
  exports: [UsersService, UserActivityService],
})
export class UsersModule {}
