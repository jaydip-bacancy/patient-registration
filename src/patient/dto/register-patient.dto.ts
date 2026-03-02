import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsDateString,
  IsPhoneNumber,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Gender, MaritalStatus, GovtIdType } from '@prisma/client';

export class RegisterPatientDto {
  @ApiProperty({ description: 'Patient first name', example: 'Raj' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'Patient last name', example: 'Sharma' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    description: 'Date of birth (ISO 8601)',
    example: '1990-05-15',
  })
  @IsDateString()
  dob: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    description: 'Primary contact phone in E.164 format',
    example: '+919876543210',
  })
  @IsString()
  @IsPhoneNumber(null as any)
  phone: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'raj.sharma@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Street address', example: '12B, MG Road' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Mumbai' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'State', example: 'Maharashtra' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ description: '6-digit PIN code', example: '400001' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  pincode?: string;

  @ApiPropertyOptional({ enum: MaritalStatus, example: MaritalStatus.MARRIED })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @ApiPropertyOptional({ description: 'Occupation', example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string;

  @ApiPropertyOptional({ enum: GovtIdType, example: GovtIdType.AADHAAR })
  @IsOptional()
  @IsEnum(GovtIdType)
  govtIdType?: GovtIdType;

  @ApiPropertyOptional({ description: 'Government ID number', example: '1234-5678-9012' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  govtIdNumber?: string;
}
