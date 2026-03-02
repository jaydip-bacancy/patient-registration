import { Module } from '@nestjs/common';
import { EmergencyContactController } from './emergency-contact.controller';
import { EmergencyContactService } from './emergency-contact.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [EmergencyContactController],
  providers: [EmergencyContactService],
})
export class EmergencyContactModule {}
