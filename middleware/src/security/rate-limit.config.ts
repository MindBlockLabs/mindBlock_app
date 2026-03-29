import { Request } from 'express';
import {
  createRateLimitTier,
  RateLimitTier,
} from './rate-limit.middleware';

export interface RateLimitEnvironment {
  RATE_LIMIT_AUTH_LIMIT?: string;
  RATE_LIMIT_AUTH_WINDOW_MS?: string;
  RATE_LIMIT_AUTH_BURST?: string;
  RATE_LIMIT_PUZZLE_SUBMIT_LIMIT?: string;
  RATE_LIMIT_PUZZLE_SUBMIT_WINDOW_MS?: string;
  RATE_LIMIT_PUZZLE_SUBMIT_BURST?: string;
  RATE_LIMIT_DAILY_QUEST_LIMIT?: string;
  RATE_LIMIT_DAILY_QUEST_WINDOW_MS?: string;
  RATE_LIMIT_DAILY_QUEST_BURST?: string;
  RATE_LIMIT_READ_LIMIT?: string;
  RATE_LIMIT_READ_WINDOW_MS?: string;
  RATE_LIMIT_READ_BURST?: string;
  RATE_LIMIT_ADMIN_LIMIT?: string;
  RATE_LIMIT_ADMIN_WINDOW_MS?: string;
  RATE_LIMIT_ADMIN_BURST?: string;
  RATE_LIMIT_PUBLIC_LIMIT?: string;
  RATE_LIMIT_PUBLIC_WINDOW_MS?: string;
  RATE_LIMIT_PUBLIC_BURST?: string;
  RATE_LIMIT_WHITELIST_IPS?: string;
}

export interface RateLimitResolvedConfig {
  tiers: RateLimitTier[];
  whitelistIps: string[];
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseCsv(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function isReadOnlyRequest(req: Request): boolean {
  return ['GET', 'HEAD'].includes(req.method.toUpperCase());
}

export function createDefaultRateLimitConfig(
  env: RateLimitEnvironment = process.env,
): RateLimitResolvedConfig {
  const tiers: RateLimitTier[] = [
    createRateLimitTier(
      'auth',
      parseNumber(env.RATE_LIMIT_AUTH_LIMIT, 5),
      parseNumber(env.RATE_LIMIT_AUTH_WINDOW_MS, 15 * 60 * 1000),
      {
        burstAllowance: parseNumber(env.RATE_LIMIT_AUTH_BURST, 0),
        methods: ['POST'],
        pathPatterns: [
          '/auth/signIn',
          '/auth/stellar-wallet-login',
          '/auth/google-authentication',
          '/auth/forgot-password',
          '/auth/reset-password/*',
          '/auth/refreshToken',
        ],
      },
    ),
    createRateLimitTier(
      'puzzle-submit',
      parseNumber(env.RATE_LIMIT_PUZZLE_SUBMIT_LIMIT, 30),
      parseNumber(env.RATE_LIMIT_PUZZLE_SUBMIT_WINDOW_MS, 60 * 60 * 1000),
      {
        burstAllowance: parseNumber(env.RATE_LIMIT_PUZZLE_SUBMIT_BURST, 0),
        methods: ['POST'],
        pathPatterns: ['/progress/submit'],
      },
    ),
    createRateLimitTier(
      'daily-quest-generate',
      parseNumber(env.RATE_LIMIT_DAILY_QUEST_LIMIT, 2),
      parseNumber(
        env.RATE_LIMIT_DAILY_QUEST_WINDOW_MS,
        24 * 60 * 60 * 1000,
      ),
      {
        burstAllowance: parseNumber(env.RATE_LIMIT_DAILY_QUEST_BURST, 0),
        methods: ['GET'],
        pathPatterns: ['/daily-quest'],
      },
    ),
    createRateLimitTier(
      'admin',
      parseNumber(env.RATE_LIMIT_ADMIN_LIMIT, 1000),
      parseNumber(env.RATE_LIMIT_ADMIN_WINDOW_MS, 60 * 60 * 1000),
      {
        burstAllowance: parseNumber(env.RATE_LIMIT_ADMIN_BURST, 0),
        pathPatterns: ['/admin/**'],
      },
    ),
    createRateLimitTier(
      'public-landing',
      parseNumber(env.RATE_LIMIT_PUBLIC_LIMIT, 1000),
      parseNumber(env.RATE_LIMIT_PUBLIC_WINDOW_MS, 60 * 60 * 1000),
      {
        burstAllowance: parseNumber(env.RATE_LIMIT_PUBLIC_BURST, 0),
        methods: ['GET'],
        pathPatterns: ['/'],
      },
    ),
    createRateLimitTier(
      'read-only',
      parseNumber(env.RATE_LIMIT_READ_LIMIT, 300),
      parseNumber(env.RATE_LIMIT_READ_WINDOW_MS, 60 * 60 * 1000),
      {
        burstAllowance: parseNumber(env.RATE_LIMIT_READ_BURST, 0),
        match: isReadOnlyRequest,
        pathPatterns: ['/**'],
      },
    ),
  ];

  return {
    tiers,
    whitelistIps: parseCsv(env.RATE_LIMIT_WHITELIST_IPS),
  };
}
