import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { HttpService } from '@nestjs/axios'
import { Repository } from 'typeorm'
import { IQAssessmentService } from './providers/iq-assessment.service'
import { IqAttemptService } from './providers/iq-attempt.service'
import { IQAssessmentSession } from './entities/iq-assessment-session.entity'
import { IQQuestion, QuestionDifficulty, QuestionCategory } from './entities/iq-question.entity'
import { IQAnswer } from './entities/iq-answer.entity'
import { User } from '../users/user.entity'
import { StandaloneSubmitAnswerDto } from './dto/submit-answer.dto'
import { RandomQuestionsQueryDto } from './dto/random-questions-query.dto'
import { of } from 'rxjs'

describe('IQAssessmentService', () => {
  let service: IQAssessmentService
  let questionRepository: Repository<IQQuestion>
  let iqAttemptService: IqAttemptService
  let httpService: HttpService

  const mockQuestion: IQQuestion = {
    id: 'test-question-id',
    questionText: 'What is 2 + 2?',
    options: ['3', '4', '5', '6'],
    correctAnswer: '4',
    explanation: 'Basic arithmetic',
    difficulty: QuestionDifficulty.EASY,
    category: QuestionCategory.MATHEMATICS,
    answers: [],
    attempts: [],
  }

  const mockQuestionRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
    create: jest.fn(),
    save: jest.fn(),
  }

  const mockIqAttemptService = {
    create: jest.fn(),
  }

  const mockHttpService = {
    get: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IQAssessmentService,
        {
          provide: getRepositoryToken(IQAssessmentSession),
          useValue: {},
        },
        {
          provide: getRepositoryToken(IQQuestion),
          useValue: mockQuestionRepository,
        },
        {
          provide: getRepositoryToken(IQAnswer),
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: IqAttemptService,
          useValue: mockIqAttemptService,
        },
      ],
    }).compile()

    service = module.get<IQAssessmentService>(IQAssessmentService)
    questionRepository = module.get<Repository<IQQuestion>>(getRepositoryToken(IQQuestion))
    iqAttemptService = module.get<IqAttemptService>(IqAttemptService)
    httpService = module.get<HttpService>(HttpService)

    mockHttpService.get.mockImplementation(() => ({
      pipe: () => of({
        response_code: 0,
        results: [
          {
            question: 'External question 1',
            correct_answer: 'A',
            incorrect_answers: ['B', 'C', 'D'],
          },
        ]
      })
    }));
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('submitStandaloneAnswer', () => {
    it('should submit a correct answer successfully', async () => {
      const submitDto: StandaloneSubmitAnswerDto = {
        questionId: 'test-question-id',
        selectedAnswer: '4',
      }

      mockQuestionRepository.findOne.mockResolvedValue(mockQuestion)
      mockIqAttemptService.create.mockResolvedValue({})

      const result = await service.submitStandaloneAnswer(submitDto)

      expect(result.isCorrect).toBe(true)
      expect(result.correctAnswer).toBe('4')
      expect(result.selectedAnswer).toBe('4')
      expect(result.questionId).toBe('test-question-id')
      expect(result.explanation).toBe('Basic arithmetic')
      expect(mockIqAttemptService.create).toHaveBeenCalledWith({
        userId: undefined,
        questionId: 'test-question-id',
        selectedAnswer: '4',
        correctAnswer: '4',
        isCorrect: true,
      })
    })

    it('should submit an incorrect answer successfully', async () => {
      const submitDto: StandaloneSubmitAnswerDto = {
        questionId: 'test-question-id',
        selectedAnswer: '5',
      }

      mockQuestionRepository.findOne.mockResolvedValue(mockQuestion)
      mockIqAttemptService.create.mockResolvedValue({})

      const result = await service.submitStandaloneAnswer(submitDto)

      expect(result.isCorrect).toBe(false)
      expect(result.correctAnswer).toBe('4')
      expect(result.selectedAnswer).toBe('5')
      expect(mockIqAttemptService.create).toHaveBeenCalledWith({
        userId: undefined,
        questionId: 'test-question-id',
        selectedAnswer: '5',
        correctAnswer: '4',
        isCorrect: false,
      })
    })

    it('should throw NotFoundException when question not found', async () => {
      const submitDto: StandaloneSubmitAnswerDto = {
        questionId: 'non-existent-id',
        selectedAnswer: '4',
      }

      mockQuestionRepository.findOne.mockResolvedValue(null)

      await expect(service.submitStandaloneAnswer(submitDto)).rejects.toThrow('Question not found')
    })
  })

  describe('getRandomQuestionsWithFilters', () => {
    it('should return filtered questions from database', async () => {
      const queryDto: RandomQuestionsQueryDto = {
        difficulty: QuestionDifficulty.EASY,
        category: QuestionCategory.MATHEMATICS,
        count: 2,
      }

      // Return exactly 'count' questions from DB for every call
      const mockQuestions = [mockQuestion, { ...mockQuestion, id: 'test-question-id-2' }]
      
      // Reset the mock for this test
      mockQuestionRepository.createQueryBuilder.mockReturnValue({
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockQuestions),
      })
      
      // Ensure no external API calls are made
      const spy = jest.spyOn(mockHttpService, 'get');

      const result = await service.getRandomQuestionsWithFilters(queryDto)

      expect(result).toHaveLength(2)
      expect(result[0].options).toBeDefined()
      expect(spy).not.toHaveBeenCalled();
    })

    it('should fetch external questions when not enough in database', async () => {
      const queryDto: RandomQuestionsQueryDto = {
        difficulty: QuestionDifficulty.HARD,
        count: 2,
      }

      // Only 1 question in DB, so external API will be called
      const mockQuestions = [mockQuestion]
      
      // Reset the mock for this test
      mockQuestionRepository.createQueryBuilder.mockReturnValue({
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockQuestions),
      })

      // Mock the external question that will be created and saved
      const externalQuestion = {
        id: 'external-question-id',
        questionText: 'External question 1',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'A',
        explanation: null,
        difficulty: QuestionDifficulty.HARD,
        category: QuestionCategory.GENERAL_KNOWLEDGE,
        answers: [],
        attempts: [],
      };

      mockQuestionRepository.create.mockReturnValue([externalQuestion]);
      mockQuestionRepository.save.mockResolvedValue([externalQuestion]);

      const result = await service.getRandomQuestionsWithFilters(queryDto)

      expect(result).toHaveLength(2) // 1 from DB + 1 from external
      expect(mockHttpService.get).toHaveBeenCalled()
    })
  })
}) 