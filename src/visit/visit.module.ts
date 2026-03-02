import { Module } from '@nestjs/common';
import { VisitController, PatientVisitController } from './visit.controller';
import { VisitService } from './visit.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [VisitController, PatientVisitController],
  providers: [VisitService],
})
export class VisitModule {}
