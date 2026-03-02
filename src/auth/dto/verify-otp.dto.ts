import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Phone number in E.164 format',
    example: '+919876543210',
  })
  @IsString()
  @IsPhoneNumber(null as any)
  phone: string;

  @ApiProperty({
    description: 'One-time password sent to the phone',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  otp: string;
}
