import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { ApiKey, ApiKeyScope } from './api-key.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Generate a new API key for a user
   */
  async generateApiKey(
    userId: string,
    name: string,
    scopes: ApiKeyScope[] = [ApiKeyScope.READ],
    expiresAt?: Date,
    ipWhitelist?: string[],
  ): Promise<{ apiKey: string; apiKeyEntity: ApiKey }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const rawKey = this.generateRawApiKey();
    const keyHash = await bcrypt.hash(rawKey, 12);

    const apiKeyEntity = this.apiKeyRepository.create({
      keyHash,
      name,
      userId,
      scopes,
      expiresAt,
      ipWhitelist,
    });

    await this.apiKeyRepository.save(apiKeyEntity);

    return { apiKey: rawKey, apiKeyEntity };
  }

  /**
   * Validate an API key and return the associated ApiKey entity
   */
  async validateApiKey(rawKey: string, clientIp?: string): Promise<ApiKey> {
    // Extract the key part (after mbk_live_ or mbk_test_)
    const keyParts = rawKey.split('_');
    if (keyParts.length !== 3 || keyParts[0] !== 'mbk') {
      throw new UnauthorizedException('Invalid API key format');
    }

    const keyHash = await this.hashApiKey(rawKey);
    const apiKey = await this.apiKeyRepository.findOne({
      where: { keyHash },
      relations: ['user'],
    });

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (!apiKey.isActive) {
      throw new UnauthorizedException('API key is inactive');
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new UnauthorizedException('API key has expired');
    }

    if (apiKey.ipWhitelist && apiKey.ipWhitelist.length > 0 && clientIp) {
      if (!apiKey.ipWhitelist.includes(clientIp)) {
        throw new UnauthorizedException('IP address not whitelisted');
      }
    }

    // Update usage stats
    apiKey.lastUsedAt = new Date();
    apiKey.usageCount += 1;
    await this.apiKeyRepository.save(apiKey);

    return apiKey;
  }

  /**
   * Check if an API key has a specific scope
   */
  hasScope(apiKey: ApiKey, requiredScope: ApiKeyScope): boolean {
    return apiKey.scopes.includes(requiredScope) || apiKey.scopes.includes(ApiKeyScope.ADMIN);
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(apiKeyId: string, userId: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: apiKeyId, userId },
    });

    if (!apiKey) {
      throw new BadRequestException('API key not found');
    }

    apiKey.isActive = false;
    await this.apiKeyRepository.save(apiKey);
  }

  /**
   * Get all API keys for a user
   */
  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    return this.apiKeyRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Rotate an API key (generate new key, revoke old)
   */
  async rotateApiKey(apiKeyId: string, userId: string): Promise<{ apiKey: string; apiKeyEntity: ApiKey }> {
    const oldApiKey = await this.apiKeyRepository.findOne({
      where: { id: apiKeyId, userId },
    });

    if (!oldApiKey) {
      throw new BadRequestException('API key not found');
    }

    // Revoke old key
    oldApiKey.isActive = false;
    await this.apiKeyRepository.save(oldApiKey);

    // Generate new key with same settings
    return this.generateApiKey(
      userId,
      `${oldApiKey.name} (rotated)`,
      oldApiKey.scopes,
      oldApiKey.expiresAt,
      oldApiKey.ipWhitelist,
    );
  }

  private generateRawApiKey(): string {
    const env = process.env.NODE_ENV === 'production' ? 'live' : 'test';
    const randomString = crypto.randomBytes(24).toString('base64url').slice(0, 32);
    return `mbk_${env}_${randomString}`;
  }

  private async hashApiKey(rawKey: string): Promise<string> {
    return bcrypt.hash(rawKey, 12);
  }
}