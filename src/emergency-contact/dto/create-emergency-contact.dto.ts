import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateEmergencyContactDto {
  @ApiProperty({ description: 'Full name of the emergency contact', example: 'Priya Sharma' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Relationship to patient',
    example: 'Spouse',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  relation: string;

  @ApiProperty({
    description: 'Emergency contact phone in E.164 format',
    example: '+919876543211',
  })
  @IsString()
  @IsPhoneNumber(null as any)
  phone: string;
}
