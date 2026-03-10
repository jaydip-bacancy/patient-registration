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
import { EmergencyContactService } from './emergency-contact.service';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Emergency Contacts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('patients/:patientId/emergency-contact')
export class EmergencyContactController {
  constructor(private readonly emergencyContactService: EmergencyContactService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add emergency contact to patient',
    description: 'Multiple emergency contacts can be added per patient.',
  })
  @ApiParam({ name: 'patientId', description: 'Patient UUID', type: String })
  @ApiResponse({
    status: 201,
    description: 'Emergency contact added',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        message: 'Request processed successfully',
        data: {
          message: 'Emergency contact added successfully',
          contact: {
            id: 'uuid',
            patientId: 'patient-uuid',
            name: 'Priya Sharma',
            relation: 'Spouse',
            phone: '+919876543211',
          },
        },
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateEmergencyContactDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.emergencyContactService.create(patientId, dto, user.sub);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all emergency contacts for a patient',
  })
  @ApiParam({ name: 'patientId', description: 'Patient UUID', type: String })
  @ApiResponse({ status: 200, description: 'List of emergency contacts' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.emergencyContactService.findByPatient(patientId);
  }
}
