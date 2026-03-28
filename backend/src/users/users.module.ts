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
import { UserProgress } from '../progress/entities/progress.entity';
import { Streak } from '../streak/entities/streak.entity';
import { DailyQuest } from '../quests/entities/daily-quest.entity';
import { XpLevelService } from './providers/xp-level.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([User, UserProgress, Streak, DailyQuest]),
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
    XpLevelService,
  ],
  exports: [UsersService, TypeOrmModule, XpLevelService],
})
export class UsersModule {}
