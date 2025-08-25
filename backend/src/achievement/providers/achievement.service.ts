import { Injectable } from '@nestjs/common';
import { AchievementUnlockerProvider } from './achievement-unlocker.service';
import { User } from '../../users/user.entity';
import { FindByUserIdProvider } from './find-by-user-id-provider';

@Injectable()
export class AchievementService {
    constructor(
        private readonly achievementUnlockerProvider: AchievementUnlockerProvider,
        private readonly fndByUserIdProvider: FindByUserIdProvider,
    ) {}

    public async achievementUnlocker(user: User) {
        return this.achievementUnlockerProvider.unlockAchievementsForUser(user)
    }

    public async findByID(userId: string) {
        return this.fndByUserIdProvider.findByUserId(userId)
    }
}
