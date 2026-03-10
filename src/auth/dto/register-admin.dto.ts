import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class RegisterAdminDto {
  @ApiProperty({ description: 'Admin email address', example: 'admin@hospital.com' })
  @IsString()
  @IsEmail()
  email: string;
}
