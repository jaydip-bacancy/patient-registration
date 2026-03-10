import {
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDoctorDto {
  @ApiProperty({
    example: 'ananya.patel@hospital.com',
    description: 'Doctor email for login (creates User + Doctor profile)',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Ananya' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Patel' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: '+919876543210' })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({ example: 'Cardiology' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  specialization: string;

  @ApiProperty({ example: 'MBBS, MD (Cardiology)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  qualification: string;

  @ApiProperty({ example: 'MCI-2024-12345', description: 'Medical Council registration number' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  registrationNo: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @ApiPropertyOptional({ example: 500, description: 'Consultation fee in INR' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  consultationFee?: number;

  @ApiPropertyOptional({ example: 'Specialist in interventional cardiology with 10+ years experience.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ example: ['Hindi', 'English', 'Gujarati'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];
}
