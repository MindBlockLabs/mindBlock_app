import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from "typeorm"
import { User } from "../../users/user.entity"
import { IQAnswer } from "./iq-answer.entity"

@Entity("iq_assessment_sessions")
export class IQAssessmentSession {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("uuid")
  userId: string

  @ManyToOne(() => User, { eager: true })
  user: User

  @CreateDateColumn()
  startTime: Date

  @Column("timestamp", { nullable: true })
  endTime?: Date

  @Column("int", { default: 0 })
  score: number

  @Column("int", { default: 8 })
  totalQuestions: number

  @Column("boolean", { default: false })
  completed: boolean

  @Column("simple-array", { nullable: true })
  questionIds?: string[]

  @OneToMany(
    () => IQAnswer,
    (answer) => answer.session,
    { cascade: true },
  )
  answers: IQAnswer[]
}
