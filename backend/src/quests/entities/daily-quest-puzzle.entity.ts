import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DailyQuest } from './daily-quest.entity';
import { Puzzle } from '../../puzzles/entities/puzzle.entity';

@Entity('daily_quest_puzzles')
@Index(['dailyQuestId', 'puzzleId'], { unique: true })
@Index(['dailyQuestId'])
export class DailyQuestPuzzle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dailyQuestId: number;

  @ManyToOne(() => DailyQuest, (quest) => quest.questPuzzles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'dailyQuestId' })
  dailyQuest: DailyQuest;

  @Column('uuid')
  puzzleId: string;

  @ManyToOne(() => Puzzle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'puzzleId' })
  puzzle: Puzzle;

  @Column('int', { default: 0 })
  orderIndex: number;
}
