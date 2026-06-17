import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_REDIS_HOST, DEFAULT_REDIS_PORT } from '../../config/redis.config';
import { StorageModule } from '../../infrastructure/storage/storage.module';
import { REPORTS_QUEUE, ReportsProcessor } from '../../jobs/reports.processor';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: REPORTS_QUEUE,
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host', DEFAULT_REDIS_HOST),
          port: config.get<number>('redis.port', DEFAULT_REDIS_PORT),
          password: config.get<string>('redis.password'),
        },
      }),
      inject: [ConfigService],
    }),
    StorageModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsProcessor],
  exports: [ReportsService],
})
export class ReportsModule {}
