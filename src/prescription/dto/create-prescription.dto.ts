import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrescriptionStatus } from '@prisma/client';

export class MedicineItemDto {
  @ApiProperty({ example: 'Metformin 500mg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  medicineName: string;

  @ApiProperty({ example: '500mg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  dosage: string;

  @ApiProperty({ example: 'Twice daily (after meals)', description: 'e.g. Once daily, Twice daily, SOS' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  frequency: string;

  @ApiProperty({ example: '30 days' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  duration: string;

  @ApiPropertyOptional({ example: 'Take with warm water. Avoid alcohol.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;
}

export class CreatePrescriptionDto {
  @ApiProperty({ example: 'visit-uuid' })
  @IsUUID()
  visitId: string;

  @ApiProperty({ example: 'patient-uuid' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ example: 'doctor-uuid' })
  @IsUUID()
  doctorId: string;

  @ApiPropertyOptional({ example: 'Type 2 Diabetes Mellitus with Hypertension' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  diagnosis?: string;

  @ApiProperty({
    type: [MedicineItemDto],
    description: 'List of prescribed medicines',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicineItemDto)
  medicines: MedicineItemDto[];

  @ApiPropertyOptional({ example: 'Avoid spicy food. Follow low-sodium diet. Exercise daily.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ example: '2026-04-15', description: 'Follow-up date' })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @ApiPropertyOptional({ enum: PrescriptionStatus, default: PrescriptionStatus.ACTIVE })
  @IsOptional()
  @IsEnum(PrescriptionStatus)
  status?: PrescriptionStatus;
}
