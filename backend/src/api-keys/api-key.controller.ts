import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeyService } from './api-key.service';
import { ApiKeyScope } from './api-key.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class CreateApiKeyDto {
  name: string;
  scopes: ApiKeyScope[];
  expiresAt?: Date;
  ipWhitelist?: string[];
}

class ApiKeyResponseDto {
  id: string;
  name: string;
  scopes: ApiKeyScope[];
  expiresAt?: Date;
  isActive: boolean;
  lastUsedAt?: Date;
  usageCount: number;
  createdAt: Date;
}

@ApiTags('API Keys')
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @ApiOperation({ summary: 'Generate a new API key' })
  @ApiResponse({ status: 201, description: 'API key generated successfully' })
  async createApiKey(
    @Request() req,
    @Body() dto: CreateApiKeyDto,
  ): Promise<{ apiKey: string; apiKeyEntity: ApiKeyResponseDto }> {
    const userId = req.user.id;

    const result = await this.apiKeyService.generateApiKey(
      userId,
      dto.name,
      dto.scopes,
      dto.expiresAt,
      dto.ipWhitelist,
    );

    const { apiKey, apiKeyEntity } = result;
    return {
      apiKey,
      apiKeyEntity: {
        id: apiKeyEntity.id,
        name: apiKeyEntity.name,
        scopes: apiKeyEntity.scopes,
        expiresAt: apiKeyEntity.expiresAt,
        isActive: apiKeyEntity.isActive,
        lastUsedAt: apiKeyEntity.lastUsedAt,
        usageCount: apiKeyEntity.usageCount,
        createdAt: apiKeyEntity.createdAt,
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all API keys for the current user' })
  @ApiResponse({ status: 200, description: 'List of API keys' })
  async getApiKeys(@Request() req): Promise<ApiKeyResponseDto[]> {
    const userId = req.user.id;
    const apiKeys = await this.apiKeyService.getUserApiKeys(userId);

    return apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      scopes: key.scopes,
      expiresAt: key.expiresAt,
      isActive: key.isActive,
      lastUsedAt: key.lastUsedAt,
      usageCount: key.usageCount,
      createdAt: key.createdAt,
    }));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ status: 200, description: 'API key revoked successfully' })
  async revokeApiKey(@Request() req, @Param('id') apiKeyId: string): Promise<void> {
    const userId = req.user.id;
    await this.apiKeyService.revokeApiKey(apiKeyId, userId);
  }

  @Post(':id/rotate')
  @ApiOperation({ summary: 'Rotate an API key' })
  @ApiResponse({ status: 201, description: 'API key rotated successfully' })
  async rotateApiKey(
    @Request() req,
    @Param('id') apiKeyId: string,
  ): Promise<{ apiKey: string; apiKeyEntity: ApiKeyResponseDto }> {
    const userId = req.user.id;

    const result = await this.apiKeyService.rotateApiKey(apiKeyId, userId);

    const { apiKey, apiKeyEntity } = result;
    return {
      apiKey,
      apiKeyEntity: {
        id: apiKeyEntity.id,
        name: apiKeyEntity.name,
        scopes: apiKeyEntity.scopes,
        expiresAt: apiKeyEntity.expiresAt,
        isActive: apiKeyEntity.isActive,
        lastUsedAt: apiKeyEntity.lastUsedAt,
        usageCount: apiKeyEntity.usageCount,
        createdAt: apiKeyEntity.createdAt,
      },
    };
  }
}