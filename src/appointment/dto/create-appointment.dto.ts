import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentType } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'patient-uuid' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ example: 'doctor-uuid' })
  @IsUUID()
  doctorId: string;

  @ApiPropertyOptional({ example: 'slot-uuid', description: 'Doctor slot UUID (optional)' })
  @IsOptional()
  @IsUUID()
  slotId?: string;

  @ApiProperty({ example: '2026-03-15', description: 'Appointment date in YYYY-MM-DD' })
  @IsDateString()
  appointmentDate: string;

  @ApiProperty({ example: '09:00', description: 'Start time in HH:MM (24h)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'startTime must be in HH:MM format' })
  startTime: string;

  @ApiProperty({ example: '09:15', description: 'End time in HH:MM (24h)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'endTime must be in HH:MM format' })
  endTime: string;

  @ApiPropertyOptional({ enum: AppointmentType, default: AppointmentType.IN_CLINIC })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @ApiPropertyOptional({ example: 'Chest pain and shortness of breath since 2 days' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonForVisit?: string;

  @ApiPropertyOptional({ example: 'First visit. BP history.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
