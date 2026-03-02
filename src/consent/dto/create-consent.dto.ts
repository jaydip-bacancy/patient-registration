import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CreateConsentDto {
  @ApiProperty({
    description: 'Patient accepts data privacy policy',
    example: true,
  })
  @IsBoolean()
  dataPrivacyAccepted: boolean;

  @ApiProperty({
    description: 'Patient consents to treatment',
    example: true,
  })
  @IsBoolean()
  treatmentConsent: boolean;

  @ApiProperty({
    description: 'Patient consents to receiving communications',
    example: true,
  })
  @IsBoolean()
  communicationConsent: boolean;
}
