/* eslint-disable prettier/prettier */
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

export const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (configService: ConfigService) => {
    const redisUrl = configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      throw new Error('REDIS_URL not defined in environment variables');
    }

    const client = new Redis(redisUrl);

    client.on('connect', () => console.log('Redis connected'));
    client.on('error', (err) => console.error('Redis error:', err));

    return client;
  },
  inject: [ConfigService],
};
