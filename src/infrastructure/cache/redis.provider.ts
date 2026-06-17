import { Provider } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import redisConfig from '../../config/redis.config';

export const REDIS = 'REDIS';

export const RedisProvider: Provider = {
  provide: REDIS,
  useFactory: (redisConfiguration: ConfigType<typeof redisConfig>): Redis => {
    return new Redis({
      host: redisConfiguration.host,
      port: redisConfiguration.port,
      password: redisConfiguration.password,
    });
  },
  inject: [redisConfig.KEY],
};
