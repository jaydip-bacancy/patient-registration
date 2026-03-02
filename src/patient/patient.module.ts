import { Module } from '@nestjs/common';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';
import { PatientRepository } from './repository/patient.repository';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [PatientController],
  providers: [PatientService, PatientRepository],
  exports: [PatientService, PatientRepository],
})
export class PatientModule {}
