import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

export const REPORTS_QUEUE = 'reports';

@Processor(REPORTS_QUEUE)
export class ReportsProcessor extends WorkerHost {
  async process(job: Job): Promise<void> {
    throw new Error('Not implemented');
  }
}
