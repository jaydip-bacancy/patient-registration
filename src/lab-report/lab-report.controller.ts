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
import { LabReportService } from './lab-report.service';
import { CreateLabReportDto } from './dto/create-lab-report.dto';
import { UpdateLabReportDto } from './dto/update-lab-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

@ApiTags('Lab Reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lab-reports')
export class LabReportController {
  constructor(private readonly labReportService: LabReportService) {}

  @Post()
  @Roles(Role.DOCTOR, Role.STAFF, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Order a new lab test for a patient visit' })
  @ApiResponse({ status: 201, description: 'Lab test ordered' })
  @ApiResponse({ status: 404, description: 'Visit not found' })
  create(@Body() dto: CreateLabReportDto, @CurrentUser() user: JwtPayload) {
    return this.labReportService.create(dto, user.sub);
  }

  @Get(':id')
  @Roles(Role.DOCTOR, Role.STAFF, Role.ADMIN, Role.PATIENT)
  @ApiOperation({ summary: 'Get lab report by ID' })
  @ApiParam({ name: 'id', description: 'Lab report UUID' })
  @ApiResponse({ status: 200, description: 'Lab report details' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.labReportService.findById(id);
  }

  @Patch(':id')
  @Roles(Role.STAFF, Role.ADMIN)
  @ApiOperation({ summary: 'Update lab report status and/or upload report URL' })
  @ApiParam({ name: 'id', description: 'Lab report UUID' })
  @ApiResponse({ status: 200, description: 'Lab report updated' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLabReportDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.labReportService.updateStatus(id, dto, user.sub);
  }
}

@ApiTags('Lab Reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients/:patientId/lab-reports')
export class PatientLabReportController {
  constructor(private readonly labReportService: LabReportService) {}

  @Get()
  @Roles(Role.DOCTOR, Role.STAFF, Role.ADMIN, Role.PATIENT)
  @ApiOperation({ summary: "Get patient's full lab report history" })
  @ApiParam({ name: 'patientId', description: 'Patient UUID' })
  findByPatient(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.labReportService.findByPatient(patientId);
  }
}

@ApiTags('Lab Reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('visits/:visitId/lab-reports')
export class VisitLabReportController {
  constructor(private readonly labReportService: LabReportService) {}

  @Get()
  @Roles(Role.DOCTOR, Role.STAFF, Role.ADMIN, Role.PATIENT)
  @ApiOperation({ summary: 'Get all lab reports ordered during a visit' })
  @ApiParam({ name: 'visitId', description: 'Visit UUID' })
  findByVisit(@Param('visitId', ParseUUIDPipe) visitId: string) {
    return this.labReportService.findByVisit(visitId);
  }
}
