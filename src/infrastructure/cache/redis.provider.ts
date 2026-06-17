import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { DEFAULT_REDIS_HOST, DEFAULT_REDIS_PORT } from '../../config/redis.config';

export const REDIS = 'REDIS';

export const RedisProvider: Provider = {
  provide: REDIS,
  useFactory: (config: ConfigService): Redis => {
    return new Redis({
      host: config.get<string>('redis.host', DEFAULT_REDIS_HOST),
      port: config.get<number>('redis.port', DEFAULT_REDIS_PORT),
      password: config.get<string>('redis.password'),
    });
  },
  inject: [ConfigService],
};
