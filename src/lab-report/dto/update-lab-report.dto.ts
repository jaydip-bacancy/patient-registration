import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LabReportStatus } from '@prisma/client';

export class UpdateLabReportDto {
  @ApiPropertyOptional({ enum: LabReportStatus, example: LabReportStatus.COMPLETED })
  @IsOptional()
  @IsEnum(LabReportStatus)
  status?: LabReportStatus;

  @ApiPropertyOptional({ example: 'https://reports.example.com/lab/report-12345.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reportUrl?: string;

  @ApiPropertyOptional({ example: 'HbA1c: 7.8% — Elevated.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reportNotes?: string;
}
