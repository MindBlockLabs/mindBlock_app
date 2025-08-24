import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm"
import { IQAssessmentSession } from "./iq-assessment-session.entity"
import { IQQuestion } from "./iq-question.entity"

@Entity("iq_answers")
export class IQAnswer {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("uuid")
  sessionId: string

  @ManyToOne(
    () => IQAssessmentSession,
    (session) => session.answers,
  )
  session: IQAssessmentSession

  @Column("uuid")
  questionId: string

  @ManyToOne(
    () => IQQuestion,
    (question) => question.answers,
    { eager: true },
  )
  question: IQQuestion

  @Column({ nullable: true })
  selectedOption?: string

  @Column("boolean", { default: false })
  isCorrect: boolean

  @Column("boolean", { default: false })
  skipped: boolean

  @CreateDateColumn()
  answeredAt: Date
}
