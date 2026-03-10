import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PatientModule } from './patient/patient.module';
import { EmergencyContactModule } from './emergency-contact/emergency-contact.module';
import { InsuranceModule } from './insurance/insurance.module';
import { MedicalSnapshotModule } from './medical-snapshot/medical-snapshot.module';
import { ConsentModule } from './consent/consent.module';
import { VisitModule } from './visit/visit.module';
import { AuditModule } from './audit/audit.module';
import { DoctorModule } from './doctor/doctor.module';
import { AppointmentModule } from './appointment/appointment.module';
import { PrescriptionModule } from './prescription/prescription.module';
import { LabReportModule } from './lab-report/lab-report.module';
import { VitalSignsModule } from './vital-signs/vital-signs.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PatientModule,
    EmergencyContactModule,
    InsuranceModule,
    MedicalSnapshotModule,
    ConsentModule,
    VisitModule,
    AuditModule,
    DoctorModule,
    AppointmentModule,
    PrescriptionModule,
    LabReportModule,
    VitalSignsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
