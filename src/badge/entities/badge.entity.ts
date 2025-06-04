import { LeaderboardEntry } from "src/leaderboard/entities/leaderboard.entity"
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity("badges")
export class Badge {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  title: string // e.g. Puzzle Master, Grand Champion

  @Column()
  description: string // Short badge description

  @Column({ nullable: true })
  iconUrl: string // Optional: hosted badge icon

  @Column()
  rank: number // Used for sorting or tier logic

  @Column({ default: true })
  isActive: boolean // Whether badge is currently available

  @Column({ default: false })
  isAutoAssigned: boolean // Whether badge is automatically assigned

  @OneToMany(
    () => LeaderboardEntry,
    (entry) => entry.badge,
  )
  leaderboardEntries: LeaderboardEntry[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
