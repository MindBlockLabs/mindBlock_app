import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from "typeorm"
import { User } from "../../users/user.entity"
import { IQQuestion } from "./iq-question.entity"

@Entity("iq_attempts")
@Index(["userId", "createdAt"])
@Index(["questionId", "isCorrect"])
@Index(["createdAt"])
export class IqAttempt {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ nullable: true })
  @Index()
  userId?: string

  @Column()
  @Index()
  questionId: string

  @Column()
  selectedAnswer: string

  @Column()
  correctAnswer: string

  @Column({ default: false })
  @Index()
  isCorrect: boolean

  @CreateDateColumn()
  createdAt: Date

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "userId" })
  user?: User

  @ManyToOne(
    () => IQQuestion,
    (question) => question.attempts,
    { onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "questionId" })
  question: IQQuestion
}
