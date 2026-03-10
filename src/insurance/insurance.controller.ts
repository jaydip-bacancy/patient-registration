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
import { InsuranceService } from './insurance.service';
import { CreateInsuranceDto } from './dto/create-insurance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Insurance')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('patients/:patientId/insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add insurance record to patient',
    description: 'Attaches an insurance policy to the patient record. Multiple policies allowed.',
  })
  @ApiParam({ name: 'patientId', description: 'Patient UUID', type: String })
  @ApiResponse({
    status: 201,
    description: 'Insurance added',
    schema: {
      example: {
        success: true,
        statusCode: 201,
        message: 'Request processed successfully',
        data: {
          message: 'Insurance record added successfully',
          insurance: {
            id: 'uuid',
            patientId: 'patient-uuid',
            provider: 'Star Health Insurance',
            policyNumber: 'SHI-2024-00123456',
            policyHolderName: 'Raj Sharma',
            validTill: '2025-12-31T00:00:00.000Z',
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
    @Body() dto: CreateInsuranceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.insuranceService.create(patientId, dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Get all insurance records for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient UUID', type: String })
  @ApiResponse({ status: 200, description: 'Insurance records' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.insuranceService.findByPatient(patientId);
  }
}
