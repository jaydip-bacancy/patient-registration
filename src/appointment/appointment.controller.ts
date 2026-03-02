import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Appointments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @Roles(Role.STAFF, Role.ADMIN, Role.PATIENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Book an appointment for a patient with a doctor' })
  @ApiResponse({ status: 201, description: 'Appointment booked successfully' })
  @ApiResponse({ status: 404, description: 'Patient or Doctor not found' })
  @ApiResponse({ status: 409, description: 'Slot already booked' })
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: JwtPayload) {
    return this.appointmentService.create(dto, user.sub);
  }

  @Get(':id')
  @Roles(Role.STAFF, Role.ADMIN, Role.PATIENT)
  @ApiOperation({ summary: 'Get appointment details by ID' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Appointment details' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.findById(id);
  }

  @Patch(':id/status')
  @Roles(Role.STAFF, Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: 'Update appointment status (confirm, cancel, complete, no-show)' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.appointmentService.updateStatus(id, dto, user.sub);
  }
}

@ApiTags('Appointments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients/:patientId/appointments')
export class PatientAppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get()
  @Roles(Role.STAFF, Role.ADMIN, Role.PATIENT)
  @ApiOperation({ summary: 'Get all appointments for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  @ApiResponse({ status: 200, description: 'List of appointments' })
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.appointmentService.findByPatient(patientId);
  }
}

@ApiTags('Appointments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doctors/:doctorId/appointments')
export class DoctorAppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get()
  @Roles(Role.STAFF, Role.ADMIN, Role.DOCTOR)
  @ApiOperation({ summary: "Get a doctor's appointment schedule, optionally filtered by date" })
  @ApiParam({ name: 'doctorId', description: 'Doctor UUID' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by date (YYYY-MM-DD)', example: '2026-03-15' })
  @ApiResponse({ status: 200, description: "Doctor's appointment list" })
  findByDoctor(
    @Param('doctorId', ParseUUIDPipe) doctorId: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentService.findByDoctor(doctorId, date);
  }
}
