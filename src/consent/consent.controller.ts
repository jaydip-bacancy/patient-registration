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
import { Role } from '@prisma/client';
import { ConsentService } from './consent.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Consent')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients/:patientId/consent')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Post()
  @Roles(Role.STAFF, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Capture patient consent',
    description:
      'Records patient consent for data privacy, treatment, and communication. One-time per patient — cannot be re-submitted (immutable audit trail). Contact ADMIN to override.',
  })
  @ApiParam({ name: 'patientId', description: 'Patient UUID', type: String })
  @ApiResponse({
    status: 201,
    description: 'Consent captured',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        message: 'Request processed successfully',
        data: {
          message: 'Consent captured successfully',
          consent: {
            id: 'uuid',
            patientId: 'patient-uuid',
            dataPrivacyAccepted: true,
            treatmentConsent: true,
            communicationConsent: true,
            acceptedAt: '2024-01-15T10:30:00.000Z',
          },
        },
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Consent already captured' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  capture(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateConsentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.consentService.capture(patientId, dto, user.sub);
  }

  @Get()
  @Roles(Role.STAFF, Role.ADMIN, Role.PATIENT)
  @ApiOperation({ summary: 'Get consent record for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID', type: String })
  @ApiResponse({ status: 200, description: 'Consent record found' })
  @ApiResponse({ status: 404, description: 'No consent record or patient not found' })
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.consentService.findByPatient(patientId);
  }
}
