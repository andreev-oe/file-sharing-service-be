import { IsEnum, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ReportFormat, ReportType } from '../../../common/enums';

export class CreateReportDto {
  @IsEnum(ReportType)
  type: ReportType;

  @IsUUID()
  subjectId: string;

  @IsEnum(ReportFormat)
  format: ReportFormat;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
