import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { VisitType } from '@prisma/client';

export class CreateVisitDto {
  @ApiProperty({ description: 'Patient UUID', example: 'a1b2c3d4-...' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ enum: VisitType, example: VisitType.OPD })
  @IsEnum(VisitType)
  visitType: VisitType;

  @ApiProperty({ description: 'Department name', example: 'Cardiology' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  department: string;

  @ApiProperty({ description: 'Attending doctor name', example: 'Dr. Ananya Patel' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  doctorName: string;

  @ApiProperty({
    description: 'Visit date and time (ISO 8601)',
    example: '2024-01-15T09:30:00.000Z',
  })
  @IsDateString()
  visitDate: string;

  @ApiPropertyOptional({
    description: 'Clinical notes for this visit',
    example: 'Patient complains of chest pain. ECG ordered.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
