import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsString } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    description: 'Phone number in E.164 format',
    example: '+919876543210',
  })
  @IsString()
  @IsPhoneNumber(null as any)
  phone: string;
}
