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
import { VisitService } from './visit.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Visits')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('visits')
export class VisitController {
  constructor(private readonly visitService: VisitService) {}

  @Post()
  @Roles(Role.STAFF, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new visit (transactional encounter)',
    description:
      'Records a new clinical encounter for a patient. Visits are completely separate from the patient identity record and represent transactional data.',
  })
  @ApiResponse({
    status: 201,
    description: 'Visit created successfully',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        message: 'Request processed successfully',
        data: {
          message: 'Visit created successfully',
          visit: {
            id: 'uuid',
            patientId: 'patient-uuid',
            visitType: 'OPD',
            department: 'Cardiology',
            doctorName: 'Dr. Ananya Patel',
            visitDate: '2024-01-15T09:30:00.000Z',
            notes: 'Patient complains of chest pain. ECG ordered.',
            createdAt: '2024-01-15T10:30:00.000Z',
            patient: {
              uhid: 'UHID-24-482910',
              firstName: 'Raj',
              lastName: 'Sharma',
            },
          },
        },
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  create(@Body() dto: CreateVisitDto, @CurrentUser() user: JwtPayload) {
    return this.visitService.create(dto, user.sub);
  }

  @Get(':id')
  @Roles(Role.STAFF, Role.ADMIN, Role.PATIENT)
  @ApiOperation({ summary: 'Get a visit by ID' })
  @ApiParam({ name: 'id', description: 'Visit UUID', type: String })
  @ApiResponse({ status: 200, description: 'Visit found' })
  @ApiResponse({ status: 404, description: 'Visit not found' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.visitService.findById(id);
  }
}

// ─── Nested patient visits route ───────────────────────────────────────────
@ApiTags('Visits')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients/:patientId/visits')
export class PatientVisitController {
  constructor(private readonly visitService: VisitService) {}

  @Get()
  @Roles(Role.STAFF, Role.ADMIN, Role.PATIENT)
  @ApiOperation({
    summary: 'Get all visits for a patient',
    description: 'Returns visit history for the given patient, ordered by most recent first.',
  })
  @ApiParam({ name: 'patientId', description: 'Patient UUID', type: String })
  @ApiResponse({
    status: 200,
    description: 'List of visits',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Request processed successfully',
        data: {
          visits: [],
          total: 0,
        },
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.visitService.findByPatient(patientId);
  }
}
