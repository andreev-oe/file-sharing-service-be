import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

export const CLEANUP_QUEUE = 'cleanup';

@Processor(CLEANUP_QUEUE)
export class CleanupProcessor extends WorkerHost {
  async process(job: Job): Promise<void> {
    throw new Error('Not implemented');
  }
}
