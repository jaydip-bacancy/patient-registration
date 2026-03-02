import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PatientRepository } from './repository/patient.repository';
import { AuditService } from '../audit/audit.service';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { AuditAction } from '@prisma/client';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly patientRepository: PatientRepository,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterPatientDto, createdBy: string) {
    const uhid = this.generateUhid();

    const patient = await this.prisma.$transaction(async (tx) => {
      const created = await this.patientRepository.create(dto, uhid, createdBy, tx);
      return created;
    });

    await this.auditService.log({
      entityType: 'Patient',
      entityId: patient.id,
      action: AuditAction.CREATE,
      performedBy: createdBy,
      metadata: { uhid: patient.uhid, phone: patient.phone },
    });

    this.logger.log(`Patient registered: UHID=${uhid}, id=${patient.id}`);
    return { message: 'Patient registered successfully', patient };
  }

  async getById(id: string) {
    return this.patientRepository.findById(id);
  }

  async searchByPhone(phone: string) {
    const patients = await this.patientRepository.searchByPhone(phone);
    return { patients, total: patients.length };
  }

  async softDelete(id: string, performedBy: string) {
    const patient = await this.patientRepository.findById(id);
    await this.patientRepository.softDelete(patient.id);

    await this.auditService.log({
      entityType: 'Patient',
      entityId: patient.id,
      action: AuditAction.DELETE,
      performedBy,
      metadata: { reason: 'Soft delete requested' },
    });

    return { message: 'Patient deactivated successfully' };
  }

  private generateUhid(): string {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(100000 + Math.random() * 900000);
    return `UHID-${year}-${random}`;
  }
}
