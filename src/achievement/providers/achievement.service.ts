import { Injectable } from '@nestjs/common';
import { AchievementUnlockerProvider } from './achievement-unlocker.service';
import { User } from 'src/users/user.entity';

@Injectable()
export class AchievementService {
    constructor(
        private readonly achievementUnlockerProvider: AchievementUnlockerProvider
    ) {}

    public async achievementUnlocker(user: User) {
        return this,this.achievementUnlockerProvider.unlockAchievementsForUser(user)
    }
}
