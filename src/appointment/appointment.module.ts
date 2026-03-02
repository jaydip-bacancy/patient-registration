import { Module } from '@nestjs/common';
import {
  AppointmentController,
  DoctorAppointmentController,
  PatientAppointmentController,
} from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [
    AppointmentController,
    PatientAppointmentController,
    DoctorAppointmentController,
  ],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
