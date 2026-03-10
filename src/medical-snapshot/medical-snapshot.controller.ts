import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MedicalSnapshotService } from './medical-snapshot.service';
import { CreateMedicalSnapshotDto } from './dto/create-medical-snapshot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Medical Snapshot')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('patients/:patientId/medical-snapshot')
export class MedicalSnapshotController {
  constructor(private readonly medicalSnapshotService: MedicalSnapshotService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create or update medical snapshot',
    description:
      'Upserts the light medical intake snapshot for a patient. One snapshot per patient (1:1). Calling this again will overwrite.',
  })
  @ApiParam({ name: 'patientId', description: 'Patient UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Medical snapshot saved',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Request processed successfully',
        data: {
          message: 'Medical snapshot saved successfully',
          snapshot: {
            id: 'uuid',
            patientId: 'patient-uuid',
            allergies: ['Penicillin'],
            chronicConditions: ['Type 2 Diabetes'],
            currentMedication: ['Metformin 500mg'],
            pastSurgeries: ['Appendectomy (2015)'],
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z',
          },
        },
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  upsert(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateMedicalSnapshotDto,
  ) {
    return this.medicalSnapshotService.upsert(patientId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get medical snapshot for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID', type: String })
  @ApiResponse({ status: 200, description: 'Medical snapshot found' })
  @ApiResponse({ status: 404, description: 'Snapshot not found or patient not found' })
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.medicalSnapshotService.findByPatient(patientId);
  }
}
