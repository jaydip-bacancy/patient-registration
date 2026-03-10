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
import { Public } from '../auth/decorators/public.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { CreateDoctorSlotDto } from './dto/create-doctor-slot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { SYSTEM_USER_ID } from '../common/constants';

@ApiTags('Doctors')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register doctor (Public)' })
  @ApiResponse({ status: 201, description: 'Doctor profile created successfully' })
  @ApiResponse({ status: 409, description: 'Registration number or phone already exists' })
  create(@Body() dto: CreateDoctorDto) {
    return this.doctorService.create(dto, SYSTEM_USER_ID);
  }

  @Get()
  @ApiOperation({ summary: 'List all active doctors, optionally filtered by specialization' })
  @ApiQuery({ name: 'specialization', required: false, description: 'Filter by specialization (partial match)' })
  @ApiResponse({ status: 200, description: 'List of doctors' })
  findAll(@Query('specialization') specialization?: string) {
    return this.doctorService.findAll(specialization);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get doctor profile with availability slots' })
  @ApiParam({ name: 'id', description: 'Doctor UUID' })
  @ApiResponse({ status: 200, description: 'Doctor profile found' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorService.findById(id);
  }

  @Post(':id/slots')
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
  @ApiOperation({ summary: 'Get all active availability slots for a doctor' })
  @ApiParam({ name: 'id', description: 'Doctor UUID' })
  getSlots(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorService.getSlots(id);
  }

  @Get(':id/available-slots')
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
