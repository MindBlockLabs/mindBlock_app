import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

/**
 * Interface for the Redis client to support token blacklisting.
 * Using a partial IORedis-like interface for flexibility.
 */
export interface RedisClient {
  get(key: string): Promise<string | null>;
}

/**
 * Options for the JWT Authentication Middleware.
 */
export interface JwtAuthMiddlewareOptions {
  /** JWT secret key used to verify the token signature. */
  secret: string;
  /** Optional list of route prefixes that should bypass authentication. */
  publicRoutes?: string[];
  /** Optional Redis client to check for blacklisted tokens. */
  redisClient?: RedisClient;
  /** Optional callback to validate if user exists in the database. */
  validateUser?: (userId: string) => Promise<any>;
  /** Header where the token is located. Default: 'authorization'. */
  authHeader?: string;
  /** Whether to log authentication attempts. Default: true. */
  logging?: boolean;
}

/**
 * Decoded payload of the JWT token.
 */
export interface DecodedUserPayload {
  userId: string;
  email: string;
  userRole: string;
  [key: string]: any;
}

/**
 * Middleware for validating JWT tokens on protected routes.
 *
 * Features:
 * - Validates Bearer token format from Authorization header.
 * - Verifies token signature and expiration.
 * - Supports token blacklisting via Redis.
 * - Bypasses specified public routes.
 * - Attaches user information to the request object.
 * - Validates user existence if validateUser hook provided.
 * - Comprehensive logging of auth attempts.
 */
@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger('JwtAuthMiddleware');

  constructor(
    @Inject('JWT_AUTH_OPTIONS')
    private readonly options: JwtAuthMiddlewareOptions,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const {
      secret,
      publicRoutes = [],
      redisClient,
      validateUser,
      authHeader = 'authorization',
      logging = true,
    } = this.options;

    // 1. Allow certain routes to bypass authentication (public endpoints)
    const isPublic = publicRoutes.some((route) => req.path.startsWith(route));
    if (isPublic) {
      if (logging) this.logger.debug(`Public route accessed: ${req.path}`);
      return next();
    }

    // 2. Validate JWT tokens from Authorization header (Bearer token format)
    const rawHeader = req.headers[authHeader.toLowerCase()];
    if (!rawHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const header = Array.isArray(rawHeader)
      ? rawHeader[0]
      : (rawHeader as string);
    if (!header.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Malformed token format (expected: Bearer <token>)',
      );
    }

    const token = header.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('No token provided in Bearer format');
    }

    try {
      // 3. Support token blacklisting for logged-out users (check Redis cache)
      if (redisClient) {
        const blacklisted = await redisClient.get(`blacklist:${token}`);
        if (blacklisted) {
          if (logging)
            this.logger.warn(
              `Blacklisted token used by user attempt: ${token.substring(0, 10)}...`,
            );
          throw new UnauthorizedException('Token blacklisted (user logged out)');
        }
      }

      // 4. Verify token signature and check expiration
      const decoded = jwt.verify(token, secret) as any;

      // 5. Extract user payload (userId, email, userRole)
      // Normalizing the payload from multiple potential formats (sub, id, userId, etc.)
      const userId = decoded.sub || decoded.userId || decoded.id;
      const userPayload: DecodedUserPayload = {
        userId,
        email: decoded.email,
        userRole: decoded.userRole || decoded.role,
      };

      if (!userPayload.userId || !userPayload.email) {
        throw new UnauthorizedException(
          'Invalid token payload: missing required fields',
        );
      }

      // 6. User not found (token valid but user deleted)
      if (validateUser) {
        const userExists = await validateUser(userPayload.userId);
        if (!userExists) {
          throw new UnauthorizedException('User not found (token may be valid but user was deleted)');
        }
      }

      // 7. Attach decoded user information to request object for downstream use
      (req as any).user = userPayload;

      // 8. Log authentication attempts
      if (logging) {
        this.logger.log(
          `Auth Success: User ${userPayload.email} | ${req.method} ${req.path}`,
        );
      }

      next();
    } catch (error) {
      // 8. Handle various token error scenarios
      if (logging) {
        this.logger.warn(
          `Auth Failed: ${req.method} ${req.path} | ${error.message}`,
        );
      }

      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException(
          'Invalid token signature or malformed token',
        );
      } else if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Authentication failed');
    }
  }
}
