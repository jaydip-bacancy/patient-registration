import { Module } from '@nestjs/common';
import {
  LabReportController,
  PatientLabReportController,
  VisitLabReportController,
} from './lab-report.controller';
import { LabReportService } from './lab-report.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [
    LabReportController,
    PatientLabReportController,
    VisitLabReportController,
  ],
  providers: [LabReportService],
  exports: [LabReportService],
})
export class LabReportModule {}
