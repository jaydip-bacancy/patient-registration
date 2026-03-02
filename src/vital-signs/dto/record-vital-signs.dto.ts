import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordVitalSignsDto {
  @ApiProperty({ example: 'visit-uuid' })
  @IsUUID()
  visitId: string;

  @ApiPropertyOptional({
    example: '120/80',
    description: 'Blood pressure in systolic/diastolic format (mmHg)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2,3}\/\d{2,3}$/, { message: 'bloodPressure must be in format systolic/diastolic (e.g. 120/80)' })
  bloodPressure?: string;

  @ApiPropertyOptional({ example: 78, description: 'Pulse rate in beats per minute' })
  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(300)
  pulseRate?: number;

  @ApiPropertyOptional({ example: 98.6, description: 'Body temperature in °F' })
  @IsOptional()
  @IsNumber()
  @Min(90)
  @Max(115)
  temperature?: number;

  @ApiPropertyOptional({ example: 72.5, description: 'Weight in kg' })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(500)
  weight?: number;

  @ApiPropertyOptional({ example: 170, description: 'Height in cm' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  height?: number;

  @ApiPropertyOptional({ example: 98, description: 'Oxygen saturation percentage (SpO2)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  oxygenSaturation?: number;

  @ApiPropertyOptional({ example: 16, description: 'Respiratory rate (breaths per minute)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  respiratoryRate?: number;
}
