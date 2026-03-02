import { Module } from '@nestjs/common';
import {
  PatientPrescriptionController,
  PrescriptionController,
  VisitPrescriptionController,
} from './prescription.controller';
import { PrescriptionService } from './prescription.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [
    PrescriptionController,
    VisitPrescriptionController,
    PatientPrescriptionController,
  ],
  providers: [PrescriptionService],
  exports: [PrescriptionService],
})
export class PrescriptionModule {}
