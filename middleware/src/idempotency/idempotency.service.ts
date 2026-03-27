import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import * as crypto from 'crypto';

@Injectable()
export class IdempotencyService {
  constructor(private readonly redisService: RedisService) {}

  async generateKey(req: any): Promise<string> {
    const userId = req.user?.id || 'anon';
    const bodyHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
    return `${userId}:${req.method}:${req.originalUrl}:${bodyHash}`;
  }

  async storeResponse(key: string, response: any, ttl: number) {
    const client = this.redisService.getClient();
    await client.set(key, JSON.stringify(response), 'EX', ttl, 'NX'); // SETNX for atomicity
  }

  async getResponse(key: string): Promise<any | null> {
    const client = this.redisService.getClient();
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  }
}
