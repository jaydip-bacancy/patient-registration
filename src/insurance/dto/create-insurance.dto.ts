import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateInsuranceDto {
  @ApiProperty({ description: 'Insurance provider name', example: 'Star Health Insurance' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  provider: string;

  @ApiProperty({ description: 'Policy number', example: 'SHI-2024-00123456' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  policyNumber: string;

  @ApiProperty({ description: 'Name on the policy', example: 'Raj Sharma' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  policyHolderName: string;

  @ApiProperty({
    description: 'Policy validity end date (ISO 8601)',
    example: '2025-12-31',
  })
  @IsDateString()
  validTill: string;
}
