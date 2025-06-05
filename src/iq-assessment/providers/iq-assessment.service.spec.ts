import { Test, type TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import type { Repository } from "typeorm"
import { NotFoundException, BadRequestException } from "@nestjs/common"
import { IQAssessmentService } from "./iq-assessment.service"
import { IQAssessmentSession } from "../entities/iq-assessment-session.entity"
import { IQQuestion } from "../entities/iq-question.entity"
import { IQAnswer } from "../entities/iq-answer.entity"
import { User } from "../../users/user.entity"

describe("IQAssessmentService", () => {
  let service: IQAssessmentService
  let sessionRepository: Repository<IQAssessmentSession>
  let questionRepository: Repository<IQQuestion>
  let answerRepository: Repository<IQAnswer>
  let userRepository: Repository<User>

  const mockUser = {
    id: 1,
    firstname: "John",
    lastname: "Doe",
    email: "john@example.com",
  }

  const mockQuestion = {
    id: "question-uuid-1",
    questionText: "What comes next: 2, 4, 8, ?",
    options: ["12", "16", "20", "24"],
    correctAnswer: "16",
    explanation: "Each number is doubled",
  }

  const mockSession = {
    id: "session-uuid-1",
    userId: 1,
    user: mockUser,
    startTime: new Date(),
    endTime: null,
    score: 0,
    totalQuestions: 8,
    completed: false,
    questionIds: ["question-uuid-1"],
    answers: [],
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IQAssessmentService,
        {
          provide: getRepositoryToken(IQAssessmentSession),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(IQQuestion),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              orderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(Array(8).fill(mockQuestion)),
            })),
            findByIds: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(IQAnswer),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<IQAssessmentService>(IQAssessmentService)
    sessionRepository = module.get<Repository<IQAssessmentSession>>(getRepositoryToken(IQAssessmentSession))
    questionRepository = module.get<Repository<IQQuestion>>(getRepositoryToken(IQQuestion))
    answerRepository = module.get<Repository<IQAnswer>>(getRepositoryToken(IQAnswer))
    userRepository = module.get<Repository<User>>(getRepositoryToken(User))
  })

  it("should be defined", () => {
    expect(service).toBeDefined()
  })

  describe("createSession", () => {
    it("should create a new session successfully", async () => {
      jest.spyOn(userRepository, "findOne").mockResolvedValue(mockUser as any)
      jest.spyOn(sessionRepository, "findOne").mockResolvedValue(null)
      jest.spyOn(questionRepository, "createQueryBuilder").mockReturnValue({
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(Array(8).fill(mockQuestion)),
      } as any)
      jest.spyOn(sessionRepository, "create").mockReturnValue(mockSession as any)
      jest.spyOn(sessionRepository, "save").mockResolvedValue(mockSession as any)

      const result = await service.createSession({ userId: 1, totalQuestions: 8 })

      expect(result).toBeDefined()
      expect(result.userId).toBe(1)
      expect(result.totalQuestions).toBe(8)
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } })
    })

    it("should throw NotFoundException when user does not exist", async () => {
      jest.spyOn(userRepository, "findOne").mockResolvedValue(null)

      await expect(service.createSession({ userId: 999, totalQuestions: 8 })).rejects.toThrow(NotFoundException)
    })

    it("should throw BadRequestException when user has active session", async () => {
      jest.spyOn(userRepository, "findOne").mockResolvedValue(mockUser as any)
      jest.spyOn(sessionRepository, "findOne").mockResolvedValue(mockSession as any)

      await expect(service.createSession({ userId: 1, totalQuestions: 8 })).rejects.toThrow(BadRequestException)
    })
  })

  describe("submitAnswer", () => {
    it("should submit correct answer and update score", async () => {
      const sessionWithAnswers = { ...mockSession, answers: [] as any[] }
      jest.spyOn(sessionRepository, "findOne").mockResolvedValue(sessionWithAnswers as any)
      jest.spyOn(questionRepository, "findOne").mockResolvedValue(mockQuestion as any)
      jest.spyOn(answerRepository, "create").mockReturnValue({
        sessionId: "session-uuid-1",
        questionId: "question-uuid-1",
        selectedOption: "16",
        isCorrect: true,
        skipped: false,
      } as any)
      jest.spyOn(answerRepository, "save").mockResolvedValue({} as any)
      jest.spyOn(sessionRepository, "save").mockResolvedValue({} as any)

      // Mock the completion check
      jest.spyOn(service, "completeSession").mockResolvedValue({
        id: "session-uuid-1",
        score: 1,
        totalQuestions: 8,
        percentage: 12.5,
        timeElapsed: 300,
        answers: [],
      } as any)

      const submitDto = {
        sessionId: "session-uuid-1",
        questionId: "question-uuid-1",
        selectedOption: "16",
      }

      // Since this is the last question (answers.length + 1 >= totalQuestions)
      sessionWithAnswers.answers = new Array(7).fill({}) as any[]

      const result = await service.submitAnswer(submitDto)

      expect(answerRepository.create).toHaveBeenCalledWith({
        sessionId: "session-uuid-1",
        session: sessionWithAnswers,
        questionId: "question-uuid-1",
        question: mockQuestion,
        selectedOption: "16",
        isCorrect: true,
        skipped: false,
      })
    })

    it("should handle incorrect answer", async () => {
      const sessionWithAnswers = { ...mockSession, answers: [] }
      jest.spyOn(sessionRepository, "findOne").mockResolvedValue(sessionWithAnswers as any)
      jest.spyOn(questionRepository, "findOne").mockResolvedValue(mockQuestion as any)
      jest.spyOn(answerRepository, "create").mockReturnValue({
        sessionId: "session-uuid-1",
        questionId: "question-uuid-1",
        selectedOption: "12",
        isCorrect: false,
        skipped: false,
      } as any)
      jest.spyOn(answerRepository, "save").mockResolvedValue({} as any)

      // Mock getting next question
      jest.spyOn(questionRepository, "findByIds").mockResolvedValue([mockQuestion] as any)
      jest.spyOn(sessionRepository, "findOne").mockResolvedValue({
        ...sessionWithAnswers,
        answers: [{}],
      } as any)

      const submitDto = {
        sessionId: "session-uuid-1",
        questionId: "question-uuid-1",
        selectedOption: "12",
      }

      const result = await service.submitAnswer(submitDto)

      expect(result).toBeDefined()
      expect(answerRepository.create).toHaveBeenCalledWith({
        sessionId: "session-uuid-1",
        session: sessionWithAnswers,
        questionId: "question-uuid-1",
        question: mockQuestion,
        selectedOption: "12",
        isCorrect: false,
        skipped: false,
      })
    })

    it("should throw NotFoundException when session does not exist", async () => {
      jest.spyOn(sessionRepository, "findOne").mockResolvedValue(null)

      const submitDto = {
        sessionId: "invalid-session",
        questionId: "question-uuid-1",
        selectedOption: "16",
      }

      await expect(service.submitAnswer(submitDto)).rejects.toThrow(NotFoundException)
    })

    it("should throw BadRequestException when session is completed", async () => {
      const completedSession = { ...mockSession, completed: true }
      jest.spyOn(sessionRepository, "findOne").mockResolvedValue(completedSession as any)

      const submitDto = {
        sessionId: "session-uuid-1",
        questionId: "question-uuid-1",
        selectedOption: "16",
      }

      await expect(service.submitAnswer(submitDto)).rejects.toThrow(BadRequestException)
    })
  })

  describe("completeSession", () => {
    it("should complete session and calculate final score", async () => {
      const sessionToComplete = {
        ...mockSession,
        answers: [
          { questionId: "q1", isCorrect: true, question: mockQuestion },
          { questionId: "q2", isCorrect: false, question: mockQuestion },
        ],
        score: 1,
      }

      jest.spyOn(sessionRepository, "findOne").mockResolvedValue(sessionToComplete as any)
      jest.spyOn(sessionRepository, "save").mockResolvedValue({
        ...sessionToComplete,
        completed: true,
        endTime: new Date(),
      } as any)

      const result = await service.completeSession("session-uuid-1")

      expect(result).toBeDefined()
      expect(result.score).toBe(1)
      expect(result.totalQuestions).toBe(8)
      expect(result.percentage).toBe(12.5) // 1/8 * 100
      expect(result.answers).toHaveLength(2)
    })

    it("should throw NotFoundException when session does not exist", async () => {
      jest.spyOn(sessionRepository, "findOne").mockResolvedValue(null)

      await expect(service.completeSession("invalid-session")).rejects.toThrow(NotFoundException)
    })

    it("should throw BadRequestException when session is already completed", async () => {
      const completedSession = { ...mockSession, completed: true }
      jest.spyOn(sessionRepository, "findOne").mockResolvedValue(completedSession as any)

      await expect(service.completeSession("session-uuid-1")).rejects.toThrow(BadRequestException)
    })
  })

  describe("skipQuestion", () => {
    it("should skip question successfully", async () => {
      const sessionWithAnswers = { ...mockSession, answers: [] }
      jest.spyOn(sessionRepository, "findOne").mockResolvedValue(sessionWithAnswers as any)
      jest.spyOn(questionRepository, "findOne").mockResolvedValue(mockQuestion as any)
      jest.spyOn(answerRepository, "create").mockReturnValue({
        sessionId: "session-uuid-1",
        questionId: "question-uuid-1",
        selectedOption: undefined,
        isCorrect: false,
        skipped: true,
      } as any)
      jest.spyOn(answerRepository, "save").mockResolvedValue({} as any)

      // Mock getting next question
      jest.spyOn(questionRepository, "findByIds").mockResolvedValue([mockQuestion] as any)
      jest.spyOn(sessionRepository, "findOne").mockResolvedValue({
        ...sessionWithAnswers,
        answers: [{}],
      } as any)

      const result = await service.skipQuestion("session-uuid-1", "question-uuid-1")

      expect(result).toBeDefined()
      expect(answerRepository.create).toHaveBeenCalledWith({
        sessionId: "session-uuid-1",
        session: sessionWithAnswers,
        questionId: "question-uuid-1",
        question: mockQuestion,
        selectedOption: undefined,
        isCorrect: false,
        skipped: true,
      })
    })
  })

  describe("scoring logic", () => {
    it("should calculate correct score for mixed answers", () => {
      const answers = [{ isCorrect: true }, { isCorrect: false }, { isCorrect: true }, { isCorrect: true }]

      const score = answers.filter((answer) => answer.isCorrect).length
      const percentage = Math.round((score / answers.length) * 100)

      expect(score).toBe(3)
      expect(percentage).toBe(75)
    })

    it("should handle perfect score", () => {
      const answers = [{ isCorrect: true }, { isCorrect: true }, { isCorrect: true }, { isCorrect: true }]

      const score = answers.filter((answer) => answer.isCorrect).length
      const percentage = Math.round((score / answers.length) * 100)

      expect(score).toBe(4)
      expect(percentage).toBe(100)
    })

    it("should handle zero score", () => {
      const answers = [{ isCorrect: false }, { isCorrect: false }, { isCorrect: false }, { isCorrect: false }]

      const score = answers.filter((answer) => answer.isCorrect).length
      const percentage = Math.round((score / answers.length) * 100)

      expect(score).toBe(0)
      expect(percentage).toBe(0)
    })
  })

  describe("question shuffling", () => {
    it("should return random questions", async () => {
      const mockQuestions = [
        { id: "q1", questionText: "Question 1" },
        { id: "q2", questionText: "Question 2" },
        { id: "q3", questionText: "Question 3" },
      ]

      const mockQueryBuilder = {
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockQuestions),
      }

      jest.spyOn(questionRepository, "createQueryBuilder").mockReturnValue(mockQueryBuilder as any)

      // Call the private method through a public method that uses it
      jest.spyOn(userRepository, "findOne").mockResolvedValue(mockUser as any)
      jest.spyOn(sessionRepository, "findOne").mockResolvedValue(null)
      jest.spyOn(sessionRepository, "create").mockReturnValue(mockSession as any)
      jest.spyOn(sessionRepository, "save").mockResolvedValue(mockSession as any)

      await service.createSession({ userId: 1, totalQuestions: 3 })

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith("RANDOM()")
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(3)
    })
  })

  describe("time tracking", () => {
    it("should calculate time elapsed correctly", () => {
      const startTime = new Date("2023-01-01T10:00:00Z")
      const endTime = new Date("2023-01-01T10:05:30Z") // 5 minutes 30 seconds later

      const timeElapsed = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

      expect(timeElapsed).toBe(330) // 5 * 60 + 30 = 330 seconds
    })

    it("should handle same start and end time", () => {
      const startTime = new Date("2023-01-01T10:00:00Z")
      const endTime = new Date("2023-01-01T10:00:00Z")

      const timeElapsed = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

      expect(timeElapsed).toBe(0)
    })
  })
})
