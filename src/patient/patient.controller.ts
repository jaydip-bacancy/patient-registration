import {
  Body,
  Controller,
  Delete,
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
import { PatientService } from './patient.service';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Patients')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new patient',
    description:
      'Creates a permanent patient identity with a unique UHID. Enforces duplicate phone check. Public endpoint - no authentication required.',
  })
  @ApiResponse({
    status: 201,
    description: 'Patient registered successfully',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        message: 'Request processed successfully',
        data: {
          message: 'Patient registered successfully',
          patient: {
            id: 'a1b2c3d4-...',
            uhid: 'UHID-24-482910',
            firstName: 'Raj',
            lastName: 'Sharma',
            dob: '1990-05-15T00:00:00.000Z',
            gender: 'MALE',
            phone: '+919876543210',
            email: 'raj.sharma@example.com',
            address: '12B, MG Road',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            maritalStatus: 'MARRIED',
            occupation: 'Software Engineer',
            govtIdType: 'AADHAAR',
            govtIdNumber: '1234-5678-9012',
            createdBy: 'staff-uuid',
            isActive: true,
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z',
          },
        },
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Phone number already registered' })
  register(@Body() dto: RegisterPatientDto) {
    return this.patientService.register(dto, 'system');
  }

  @Get('search')
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiOperation({
    summary: 'Search patients by phone',
    description: 'Returns active patients matching the phone query (partial match supported).',
  })
  @ApiQuery({ name: 'phone', required: true, example: '+9198765' })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Request processed successfully',
        data: {
          patients: [],
          total: 0,
        },
        timestamp: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  search(@Query('phone') phone: string) {
    return this.patientService.searchByPhone(phone);
  }

  @Get(':id')
  @Roles(Role.STAFF, Role.ADMIN, Role.PATIENT)
  @ApiOperation({
    summary: 'Get patient by ID',
    description: 'Returns full patient profile including emergency contacts, insurance, medical snapshot, and consent.',
  })
  @ApiParam({ name: 'id', description: 'Patient UUID', type: String })
  @ApiResponse({ status: 200, description: 'Patient found' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientService.getById(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft delete a patient',
    description: 'Deactivates a patient record (isActive = false). Data is preserved. Only ADMIN can perform this.',
  })
  @ApiParam({ name: 'id', description: 'Patient UUID', type: String })
  @ApiResponse({ status: 200, description: 'Patient deactivated successfully' })
  @ApiResponse({ status: 403, description: 'Only ADMIN can soft delete' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.patientService.softDelete(id, user.sub);
  }
}
