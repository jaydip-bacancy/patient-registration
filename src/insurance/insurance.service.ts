import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInsuranceDto } from './dto/create-insurance.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class InsuranceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(patientId: string, dto: CreateInsuranceDto, performedBy: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId, isActive: true },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with id "${patientId}" not found`);
    }

    const insurance = await this.prisma.insurance.create({
      data: {
        patientId,
        ...dto,
        validTill: new Date(dto.validTill),
      },
    });

    await this.auditService.log({
      entityType: 'Insurance',
      entityId: insurance.id,
      action: AuditAction.CREATE,
      performedBy,
      metadata: { patientId, provider: insurance.provider },
    });

    return { message: 'Insurance record added successfully', insurance };
  }

  async findByPatient(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId, isActive: true },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with id "${patientId}" not found`);
    }

    const insurances = await this.prisma.insurance.findMany({ where: { patientId } });
    return { insurances, total: insurances.length };
  }
}
