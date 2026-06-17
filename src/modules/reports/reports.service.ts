import { Injectable } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  async enqueue(userId: string, dto: CreateReportDto): Promise<{ jobId: string }> {
    throw new Error('Not implemented');
  }

  async getStatus(jobId: string): Promise<{ status: string; progress: number }> {
    throw new Error('Not implemented');
  }

  async getDownloadUrl(jobId: string): Promise<string> {
    throw new Error('Not implemented');
  }
}
