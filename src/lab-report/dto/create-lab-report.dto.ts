import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLabReportDto {
  @ApiProperty({ example: 'patient-uuid' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ example: 'visit-uuid', description: 'Visit during which the test was ordered' })
  @IsUUID()
  visitId: string;

  @ApiProperty({ example: 'HbA1c', description: 'Name of the diagnostic test' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  testName: string;

  @ApiPropertyOptional({ example: 'Metropolis Healthcare' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  labName?: string;

  @ApiPropertyOptional({ example: 'https://reports.example.com/lab/report-12345.pdf' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reportUrl?: string;

  @ApiPropertyOptional({ example: 'HbA1c: 7.8% (Normal < 5.7%). Elevated — consistent with Type 2 Diabetes.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reportNotes?: string;
}
