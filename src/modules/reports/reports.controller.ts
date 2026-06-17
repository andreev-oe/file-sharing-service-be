import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  enqueue(@Body() dto: CreateReportDto) {
    throw new Error('Not implemented');
  }

  @Get(':jobId/status')
  getStatus(@Param('jobId') jobId: string) {
    throw new Error('Not implemented');
  }

  @Get(':jobId/download')
  getDownloadUrl(@Param('jobId') jobId: string) {
    throw new Error('Not implemented');
  }
}
