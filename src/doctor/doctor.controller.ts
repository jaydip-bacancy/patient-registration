import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { CreateDoctorSlotDto } from './dto/create-doctor-slot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Doctors')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a doctor profile (Admin only)' })
  @ApiResponse({ status: 201, description: 'Doctor profile created successfully' })
  @ApiResponse({ status: 409, description: 'Registration number or phone already exists' })
  create(@Body() dto: CreateDoctorDto, @CurrentUser() user: JwtPayload) {
    return this.doctorService.create(dto, user.sub);
  }

  @Get()
  @Roles(Role.STAFF, Role.ADMIN, Role.PATIENT)
  @ApiOperation({ summary: 'List all active doctors, optionally filtered by specialization' })
  @ApiQuery({ name: 'specialization', required: false, description: 'Filter by specialization (partial match)' })
  @ApiResponse({ status: 200, description: 'List of doctors' })
  findAll(@Query('specialization') specialization?: string) {
    return this.doctorService.findAll(specialization);
  }

  @Get(':id')
  @Roles(Role.STAFF, Role.ADMIN, Role.PATIENT)
  @ApiOperation({ summary: 'Get doctor profile with availability slots' })
  @ApiParam({ name: 'id', description: 'Doctor UUID' })
  @ApiResponse({ status: 200, description: 'Doctor profile found' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorService.findById(id);
  }

  @Post(':id/slots')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a weekly availability slot to a doctor (Admin only)' })
  @ApiParam({ name: 'id', description: 'Doctor UUID' })
  @ApiResponse({ status: 201, description: 'Slot added' })
  addSlot(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDoctorSlotDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.doctorService.addSlot(id, dto, user.sub);
  }

  @Get(':id/slots')
  @Roles(Role.STAFF, Role.ADMIN, Role.PATIENT)
  @ApiOperation({ summary: 'Get all active availability slots for a doctor' })
  @ApiParam({ name: 'id', description: 'Doctor UUID' })
  getSlots(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorService.getSlots(id);
  }

  @Get(':id/available-slots')
  @Roles(Role.STAFF, Role.ADMIN, Role.PATIENT)
  @ApiOperation({ summary: 'Get available (unbooked) time slots for a doctor on a given date' })
  @ApiParam({ name: 'id', description: 'Doctor UUID' })
  @ApiQuery({ name: 'date', required: true, description: 'Date in YYYY-MM-DD format', example: '2026-03-15' })
  @ApiResponse({ status: 200, description: 'Available slots for the date' })
  getAvailableSlots(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('date') date: string,
  ) {
    return this.doctorService.getAvailableSlots(id, date);
  }
}
