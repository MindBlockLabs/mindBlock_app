import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Achievement } from "./achievement.entity";
import { User } from "../../users/user.entity";

@Entity('user_achievements')
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @ManyToOne(() => Achievement, { eager: true })
  achievement: Achievement;

  @CreateDateColumn()
  unlockedAt: Date;
}