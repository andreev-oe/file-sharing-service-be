import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import redisConfig from '../../config/redis.config';
import { RedisProvider } from './redis.provider';

@Global()
@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [RedisProvider],
  exports: [RedisProvider],
})
export class CacheModule {}
