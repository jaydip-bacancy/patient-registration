import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class ConsentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async capture(patientId: string, dto: CreateConsentDto, performedBy: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId, isActive: true },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with id "${patientId}" not found`);
    }

    const existing = await this.prisma.consent.findUnique({ where: { patientId } });
    if (existing) {
      throw new BadRequestException('Consent has already been captured for this patient. Contact admin to update.');
    }

    const consent = await this.prisma.consent.create({
      data: {
        patientId,
        ...dto,
        acceptedAt: new Date(),
      },
    });

    await this.auditService.log({
      entityType: 'Consent',
      entityId: consent.id,
      action: AuditAction.CREATE,
      performedBy,
      metadata: {
        patientId,
        dataPrivacyAccepted: consent.dataPrivacyAccepted,
        treatmentConsent: consent.treatmentConsent,
        communicationConsent: consent.communicationConsent,
      },
    });

    return { message: 'Consent captured successfully', consent };
  }

  async findByPatient(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId, isActive: true },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with id "${patientId}" not found`);
    }

    const consent = await this.prisma.consent.findUnique({ where: { patientId } });

    if (!consent) {
      throw new NotFoundException('No consent record found for this patient');
    }

    return consent;
  }
}
