import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMedicalSnapshotDto {
  @ApiPropertyOptional({
    description: 'List of known allergies',
    example: ['Penicillin', 'Dust mites'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  allergies?: string[];

  @ApiPropertyOptional({
    description: 'List of chronic conditions',
    example: ['Type 2 Diabetes', 'Hypertension'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  chronicConditions?: string[];

  @ApiPropertyOptional({
    description: 'Current medications',
    example: ['Metformin 500mg', 'Amlodipine 5mg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  currentMedication?: string[];

  @ApiPropertyOptional({
    description: 'Past surgeries',
    example: ['Appendectomy (2015)', 'Knee replacement (2020)'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  pastSurgeries?: string[];
}
