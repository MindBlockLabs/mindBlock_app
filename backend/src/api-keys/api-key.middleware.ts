import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from './api-key.service';
import { ApiKeyScope } from './api-key.entity';

export interface RequestWithApiKey extends Request {
  apiKey?: any;
  user?: any;
}

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async use(req: RequestWithApiKey, res: Response, next: NextFunction) {
    const apiKey = this.extractApiKey(req);

    if (!apiKey) {
      return next();
    }

    try {
      const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      const apiKeyEntity = await this.apiKeyService.validateApiKey(apiKey, clientIp as string);

      req.apiKey = apiKeyEntity;
      req.user = apiKeyEntity.user;

      // Store API key info in response locals for logging
      res.locals.apiKeyId = apiKeyEntity.id;
      res.locals.userId = apiKeyEntity.userId;

    } catch (error) {
      throw new UnauthorizedException(error.message);
    }

    next();
  }

  private extractApiKey(req: Request): string | null {
    // Check header first
    const headerKey = req.headers['x-api-key'] as string;
    if (headerKey) {
      return headerKey;
    }

    // Check query parameter
    const queryKey = req.query.apiKey as string;
    if (queryKey) {
      return queryKey;
    }

    return null;
  }
}

@Injectable()
export class ApiKeyAuthMiddleware implements NestMiddleware {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async use(req: RequestWithApiKey, res: Response, next: NextFunction) {
    const apiKey = this.extractApiKey(req);

    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    try {
      const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
      const apiKeyEntity = await this.apiKeyService.validateApiKey(apiKey, clientIp as string);

      req.apiKey = apiKeyEntity;
      req.user = apiKeyEntity.user;

      // Store API key info in response locals for logging
      res.locals.apiKeyId = apiKeyEntity.id;
      res.locals.userId = apiKeyEntity.userId;

    } catch (error) {
      throw new UnauthorizedException(error.message);
    }

    next();
  }

  private extractApiKey(req: Request): string | null {
    // Check header first
    const headerKey = req.headers['x-api-key'] as string;
    if (headerKey) {
      return headerKey;
    }

    // Check query parameter
    const queryKey = req.query.apiKey as string;
    if (queryKey) {
      return queryKey;
    }

    return null;
  }
}

@Injectable()
export class ApiKeyScopeMiddleware implements NestMiddleware {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly requiredScopes: ApiKeyScope[],
  ) {}

  async use(req: RequestWithApiKey, res: Response, next: NextFunction) {
    if (!req.apiKey) {
      throw new UnauthorizedException('API key authentication required');
    }

    const hasRequiredScope = this.requiredScopes.some(scope =>
      this.apiKeyService.hasScope(req.apiKey, scope)
    );

    if (!hasRequiredScope) {
      throw new UnauthorizedException('Insufficient API key permissions');
    }

    next();
  }
}