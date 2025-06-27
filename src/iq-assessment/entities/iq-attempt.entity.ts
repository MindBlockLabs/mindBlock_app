import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from "typeorm"
import { IQQuestion } from "./iq-question.entity"
import { User } from "../../users/user.entity"

@Entity("iq_attempts")
export class IqAttempt {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("uuid", { nullable: true })
  userId?: string | null

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: "userId" })
  user?: User | null

  @Column("uuid")
  questionId: string

  @ManyToOne(() => IQQuestion, { eager: true })
  @JoinColumn({ name: "questionId" })
  question: IQQuestion

  @Column("varchar", { length: 500 })
  selectedAnswer: string

  @Column("varchar", { length: 500 })
  correctAnswer: string

  @Column("boolean")
  isCorrect: boolean

  @CreateDateColumn()
  createdAt: Date
}
