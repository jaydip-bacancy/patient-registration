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
import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Prescriptions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('prescriptions')
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Post()
  @Roles(Role.DOCTOR, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Issue a digital prescription for a visit (Doctor/Admin)' })
  @ApiResponse({ status: 201, description: 'Prescription created' })
  @ApiResponse({ status: 404, description: 'Visit not found' })
  create(@Body() dto: CreatePrescriptionDto, @CurrentUser() user: JwtPayload) {
    return this.prescriptionService.create(dto, user.sub);
  }

  @Get(':id')
  @Roles(Role.DOCTOR, Role.STAFF, Role.ADMIN, Role.PATIENT)
  @ApiOperation({ summary: 'Get a prescription by ID' })
  @ApiParam({ name: 'id', description: 'Prescription UUID' })
  @ApiResponse({ status: 200, description: 'Prescription details' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.prescriptionService.findById(id);
  }
}

@ApiTags('Prescriptions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('visits/:visitId/prescriptions')
export class VisitPrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Get()
  @Roles(Role.DOCTOR, Role.STAFF, Role.ADMIN, Role.PATIENT)
  @ApiOperation({ summary: 'Get all prescriptions for a visit' })
  @ApiParam({ name: 'visitId', description: 'Visit UUID' })
  findByVisit(@Param('visitId', ParseUUIDPipe) visitId: string) {
    return this.prescriptionService.findByVisit(visitId);
  }
}

@ApiTags('Prescriptions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients/:patientId/prescriptions')
export class PatientPrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Get()
  @Roles(Role.DOCTOR, Role.STAFF, Role.ADMIN, Role.PATIENT)
  @ApiOperation({ summary: "Get patient's full prescription history" })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.prescriptionService.findByPatient(patientId);
  }
}
