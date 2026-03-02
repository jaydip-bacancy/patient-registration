import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus, example: AppointmentStatus.CONFIRMED })
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;

  @ApiPropertyOptional({ example: 'Patient requested cancellation' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancelReason?: string;
}
