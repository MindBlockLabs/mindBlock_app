import { Test, type TestingModule } from "@nestjs/testing"
import { IQAssessmentController } from "./iq-assessment.controller"
import type { CreateSessionDto } from "../dto/create-session.dto"
import type { SubmitAnswerDto } from "../dto/submit-answer.dto"
import { IQAssessmentService } from "../providers/iq-assessment.service"

describe("IQAssessmentController", () => {
  let controller: IQAssessmentController
  let service: IQAssessmentService

  const mockIQAssessmentService = {
    createSession: jest.fn(),
    getSessionProgress: jest.fn(),
    submitAnswer: jest.fn(),
    completeSession: jest.fn(),
    skipQuestion: jest.fn(),
    getUserSessions: jest.fn(),
    getSessionById: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IQAssessmentController],
      providers: [
        {
          provide: IQAssessmentService,
          useValue: mockIQAssessmentService,
        },
      ],
    }).compile()

    controller = module.get<IQAssessmentController>(IQAssessmentController)
    service = module.get<IQAssessmentService>(IQAssessmentService)
  })

  it("should be defined", () => {
    expect(controller).toBeDefined()
  })

  describe("createSession", () => {
    it("should create a new session", async () => {
      const createSessionDto: CreateSessionDto = {
        userId: 1,
        totalQuestions: 8,
      }

      const expectedResult = {
        id: "session-uuid",
        userId: 1,
        startTime: new Date(),
        score: 0,
        totalQuestions: 8,
        completed: false,
        progress: {
          currentQuestion: 1,
          totalQuestions: 8,
          timeElapsed: 0,
          completed: false,
        },
      }

      mockIQAssessmentService.createSession.mockResolvedValue(expectedResult)

      const result = await controller.createSession(createSessionDto)

      expect(result).toEqual(expectedResult)
      expect(service.createSession).toHaveBeenCalledWith(createSessionDto)
    })
  })

  describe("submitAnswer", () => {
    it("should submit an answer", async () => {
      const submitAnswerDto: SubmitAnswerDto = {
        sessionId: "session-uuid",
        questionId: "question-uuid",
        selectedOption: "16",
      }

      const expectedResult = {
        id: "session-uuid",
        progress: {
          currentQuestion: 2,
          totalQuestions: 8,
          timeElapsed: 30,
          completed: false,
        },
      }

      mockIQAssessmentService.submitAnswer.mockResolvedValue(expectedResult)

      const result = await controller.submitAnswer(submitAnswerDto)

      expect(result).toEqual(expectedResult)
      expect(service.submitAnswer).toHaveBeenCalledWith(submitAnswerDto)
    })
  })

  describe("getSessionProgress", () => {
    it("should get session progress", async () => {
      const sessionId = "session-uuid"
      const expectedResult = {
        id: sessionId,
        progress: {
          currentQuestion: 3,
          totalQuestions: 8,
          timeElapsed: 120,
          completed: false,
        },
      }

      mockIQAssessmentService.getSessionProgress.mockResolvedValue(expectedResult)

      const result = await controller.getSessionProgress(sessionId)

      expect(result).toEqual(expectedResult)
      expect(service.getSessionProgress).toHaveBeenCalledWith(sessionId)
    })
  })

  describe("completeSession", () => {
    it("should complete a session", async () => {
      const completeSessionDto = { sessionId: "session-uuid" }
      const expectedResult = {
        id: "session-uuid",
        score: 6,
        totalQuestions: 8,
        percentage: 75,
        timeElapsed: 480,
        answers: [],
      }

      mockIQAssessmentService.completeSession.mockResolvedValue(expectedResult)

      const result = await controller.completeSession(completeSessionDto)

      expect(result).toEqual(expectedResult)
      expect(service.completeSession).toHaveBeenCalledWith(completeSessionDto.sessionId)
    })
  })

  describe("skipQuestion", () => {
    it("should skip a question", async () => {
      const sessionId = "session-uuid"
      const questionId = "question-uuid"
      const expectedResult = {
        id: sessionId,
        progress: {
          currentQuestion: 2,
          totalQuestions: 8,
          timeElapsed: 45,
          completed: false,
        },
      }

      mockIQAssessmentService.skipQuestion.mockResolvedValue(expectedResult)

      const result = await controller.skipQuestion(sessionId, questionId)

      expect(result).toEqual(expectedResult)
      expect(service.skipQuestion).toHaveBeenCalledWith(sessionId, questionId)
    })
  })

  describe("getUserSessions", () => {
    it("should get user sessions", async () => {
      const userId = 1
      const expectedResult = [
        { id: "session-1", completed: true, score: 7 },
        { id: "session-2", completed: false, score: 0 },
      ]

      mockIQAssessmentService.getUserSessions.mockResolvedValue(expectedResult)

      const result = await controller.getUserSessions(userId)

      expect(result).toEqual(expectedResult)
      expect(service.getUserSessions).toHaveBeenCalledWith(userId)
    })
  })

  describe("getSessionDetails", () => {
    it("should get session details", async () => {
      const sessionId = "session-uuid"
      const expectedResult = {
        id: sessionId,
        userId: 1,
        completed: true,
        answers: [],
      }

      mockIQAssessmentService.getSessionById.mockResolvedValue(expectedResult)

      const result = await controller.getSessionDetails(sessionId)

      expect(result).toEqual(expectedResult)
      expect(service.getSessionById).toHaveBeenCalledWith(sessionId)
    })
  })
})
