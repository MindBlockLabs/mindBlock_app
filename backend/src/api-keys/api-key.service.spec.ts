import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKeyService } from './api-key.service';
import { ApiKey, ApiKeyScope } from './api-key.entity';
import { User } from '../users/user.entity';

describe('ApiKeyService', () => {
  let service: ApiKeyService;
  let apiKeyRepository: Repository<ApiKey>;
  let userRepository: Repository<User>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockApiKey = {
    id: 'key-123',
    keyHash: 'hashed-key',
    name: 'Test Key',
    userId: 'user-123',
    scopes: [ApiKeyScope.READ],
    isActive: true,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyService,
        {
          provide: getRepositoryToken(ApiKey),
          useValue: {
            create: jest.fn().mockReturnValue(mockApiKey),
            save: jest.fn().mockResolvedValue(mockApiKey),
            findOne: jest.fn().mockResolvedValue(mockApiKey),
            find: jest.fn().mockResolvedValue([mockApiKey]),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    }).compile();

    service = module.get<ApiKeyService>(ApiKeyService);
    apiKeyRepository = module.get<Repository<ApiKey>>(getRepositoryToken(ApiKey));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateApiKey', () => {
    it('should generate a new API key', async () => {
      const result = await service.generateApiKey('user-123', 'Test Key', [ApiKeyScope.READ]);

      expect(result).toHaveProperty('apiKey');
      expect(result).toHaveProperty('apiKeyEntity');
      expect(result.apiKey).toMatch(/^mbk_(live|test)_[A-Za-z0-9_-]{32}$/);
      expect(apiKeyRepository.create).toHaveBeenCalled();
      expect(apiKeyRepository.save).toHaveBeenCalled();
    });
  });

  describe('validateApiKey', () => {
    it('should validate a correct API key', async () => {
      const rawKey = 'mbk_test_abc123def456ghi789jkl012mno345pqr';
      jest.spyOn(service as any, 'hashApiKey').mockResolvedValue('hashed-key');

      const result = await service.validateApiKey(rawKey);

      expect(result).toEqual(mockApiKey);
    });

    it('should throw error for invalid key format', async () => {
      await expect(service.validateApiKey('invalid-key')).rejects.toThrow('Invalid API key format');
    });
  });
});