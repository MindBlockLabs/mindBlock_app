import { User } from 'src/users/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @ManyToOne(() => User, { eager: true })
  user: User;

  @Column()
  description: string;

  @Column()
  iconUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
