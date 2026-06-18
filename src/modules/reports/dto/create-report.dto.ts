import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { ReportFormat, ReportType } from '../../../common/enums';

export class CreateReportDto {
  @ApiProperty({ enum: ReportType, example: ReportType.USER })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ example: 'uuid-of-user-folder-or-group' })
  @IsUUID()
  subjectId: string;

  @ApiProperty({ enum: ReportFormat, example: ReportFormat.CSV })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
