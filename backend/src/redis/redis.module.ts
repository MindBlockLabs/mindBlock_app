import { Global, Module, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { redisProvider } from './redis.provider';
import { REDIS_CLIENT } from './redis.constants';
import Redis from 'ioredis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [redisProvider],
  exports: [redisProvider],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      console.log('🧹 Redis disconnected gracefully');
    }
  }
}
