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
import { VitalSignsService } from './vital-signs.service';
import { RecordVitalSignsDto } from './dto/record-vital-signs.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Vital Signs')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('visits/:visitId/vital-signs')
export class VitalSignsController {
  constructor(private readonly vitalSignsService: VitalSignsService) {}

  @Post()
  @Roles(Role.STAFF, Role.DOCTOR, Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record vital signs for a visit' })
  @ApiParam({ name: 'visitId', description: 'Visit UUID' })
  @ApiResponse({ status: 201, description: 'Vital signs recorded' })
  @ApiResponse({ status: 400, description: 'Vital signs already recorded for this visit' })
  @ApiResponse({ status: 404, description: 'Visit not found' })
  record(
    @Param('visitId', ParseUUIDPipe) visitId: string,
    @Body() dto: RecordVitalSignsDto,
  ) {
    return this.vitalSignsService.record({ ...dto, visitId });
  }

  @Get()
  @Roles(Role.STAFF, Role.DOCTOR, Role.ADMIN, Role.PATIENT)
  @ApiOperation({ summary: 'Get vital signs for a visit' })
  @ApiParam({ name: 'visitId', description: 'Visit UUID' })
  @ApiResponse({ status: 200, description: 'Vital signs data' })
  @ApiResponse({ status: 404, description: 'No vital signs recorded for this visit' })
  findByVisit(@Param('visitId', ParseUUIDPipe) visitId: string) {
    return this.vitalSignsService.findByVisit(visitId);
  }

  @Patch()
  @Roles(Role.STAFF, Role.DOCTOR, Role.ADMIN)
  @ApiOperation({ summary: 'Update vital signs for a visit (partial update allowed)' })
  @ApiParam({ name: 'visitId', description: 'Visit UUID' })
  @ApiResponse({ status: 200, description: 'Vital signs updated' })
  @ApiResponse({ status: 404, description: 'No vital signs found for visit' })
  update(
    @Param('visitId', ParseUUIDPipe) visitId: string,
    @Body() dto: Partial<RecordVitalSignsDto>,
  ) {
    return this.vitalSignsService.update(visitId, dto);
  }
}
