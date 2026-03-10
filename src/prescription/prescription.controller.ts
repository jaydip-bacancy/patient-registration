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
import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Prescriptions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('prescriptions')
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Issue a digital prescription for a visit (Doctor/Admin)' })
  @ApiResponse({ status: 201, description: 'Prescription created' })
  @ApiResponse({ status: 404, description: 'Visit not found' })
  create(@Body() dto: CreatePrescriptionDto, @CurrentUser() user: JwtPayload) {
    return this.prescriptionService.create(dto, user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a prescription by ID' })
  @ApiParam({ name: 'id', description: 'Prescription UUID' })
  @ApiResponse({ status: 200, description: 'Prescription details' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.prescriptionService.findById(id);
  }
}

@ApiTags('Prescriptions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('visits/:visitId/prescriptions')
export class VisitPrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all prescriptions for a visit' })
  @ApiParam({ name: 'visitId', description: 'Visit UUID' })
  findByVisit(@Param('visitId', ParseUUIDPipe) visitId: string) {
    return this.prescriptionService.findByVisit(visitId);
  }
}

@ApiTags('Prescriptions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('patients/:patientId/prescriptions')
export class PatientPrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Get()
  @ApiOperation({ summary: "Get patient's full prescription history" })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.prescriptionService.findByPatient(patientId);
  }
}
