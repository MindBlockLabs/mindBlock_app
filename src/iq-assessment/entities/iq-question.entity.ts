import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Index } from "typeorm"
import { IQAnswer } from "./iq-answer.entity"
import { IqAttempt } from "./iq-attempt.entity"

export enum QuestionDifficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
}

export enum QuestionCategory {
  SCIENCE = "Science",
  MATHEMATICS = "Mathematics",
  LOGIC = "Logic",
  LANGUAGE = "Language",
  HISTORY = "History",
  GEOGRAPHY = "Geography",
  LITERATURE = "Literature",
  ART = "Art",
  SPORTS = "Sports",
  ENTERTAINMENT = "Entertainment",
  GENERAL_KNOWLEDGE = "General Knowledge",
}

@Entity("iq_questions")
@Index(["difficulty"])
@Index(["category"])
@Index(["difficulty", "category"])
export class IQQuestion {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("text")
  questionText: string

  @Column("simple-array")
  options: string[]

  @Column()
  correctAnswer: string

  @Column("text", { nullable: true })
  explanation?: string

  @Column({
    type: "enum",
    enum: QuestionDifficulty,
    default: QuestionDifficulty.MEDIUM,
  })
  difficulty: QuestionDifficulty

  @Column({
    type: "enum",
    enum: QuestionCategory,
    nullable: true,
  })
  category?: QuestionCategory

  @OneToMany(
    () => IQAnswer,
    (answer) => answer.question,
  )
  answers: IQAnswer[]

  @OneToMany(
    () => IqAttempt,
    (attempt) => attempt.question,
  )
  attempts: IqAttempt[]
}
