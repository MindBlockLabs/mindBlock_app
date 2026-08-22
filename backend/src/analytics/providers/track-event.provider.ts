import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { TrackEventDto } from '../dtos/track-event.dto';

/**
 * Metadata field names (case-insensitive) that are hashed rather than
 * dropped: the raw value has no place in a table queried broadly across
 * many roles, but a stable one-way hash still lets analytics group/dedupe
 * on "same value" without exposing the original PII.
 */
const HASHED_FIELD_NAMES = new Set([
  'email',
  'emailaddress',
  'wallet',
  'walletaddress',
  'stellarwallet',
  'phone',
  'phonenumber',
  'ipaddress',
  'ip',
]);

/**
 * Metadata field names (case-insensitive) that are dropped entirely —
 * credentials/secrets have no analytics value even hashed, and keeping a
 * hash of a password/token is still a liability if the hashing scheme is
 * ever reused elsewhere.
 */
const STRIPPED_FIELD_NAMES = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'apikey',
  'ssn',
  'creditcard',
  'authorization',
]);

@Injectable()
export class TrackEventProvider {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsEventRepository: Repository<AnalyticsEvent>,
  ) {}

  async track(dto: TrackEventDto) {
    const event = this.analyticsEventRepository.create({
      eventType: dto.eventType,
      userId: dto.userId ?? '',
      entityId: dto.payload?.entityId ?? '',
      payload: this.sanitizeMetadata(dto.payload),
    });

    const saved = await this.analyticsEventRepository.save(event);

    return {
      success: true,
      message: 'Event tracked successfully',
      data: saved,
    };
  }

  /**
   * Strips or hashes known-PII field names from a free-form metadata
   * payload before it's persisted to `analytics_events`. Recurses into
   * nested objects/arrays since `payload` is arbitrary caller-supplied JSON,
   * not a fixed schema.
   */
  private sanitizeMetadata(
    payload: Record<string, any> | undefined,
  ): Record<string, any> | undefined {
    if (payload === undefined || payload === null) {
      return payload;
    }
    return this.sanitizeValue(payload) as Record<string, any>;
  }

  private sanitizeValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item));
    }

    if (value !== null && typeof value === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, fieldValue] of Object.entries(
        value as Record<string, any>,
      )) {
        const normalizedKey = key.toLowerCase();

        if (STRIPPED_FIELD_NAMES.has(normalizedKey)) {
          continue;
        }

        if (
          HASHED_FIELD_NAMES.has(normalizedKey) &&
          typeof fieldValue === 'string'
        ) {
          sanitized[key] = this.hash(fieldValue);
          continue;
        }

        sanitized[key] = this.sanitizeValue(fieldValue);
      }
      return sanitized;
    }

    return value;
  }

  /** One-way, deterministic hash so repeated values still correlate in analytics. */
  private hash(value: string): string {
    return `sha256:${createHash('sha256').update(value).digest('hex').slice(0, 16)}`;
  }
}
