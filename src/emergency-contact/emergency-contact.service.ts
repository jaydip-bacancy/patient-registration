import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmergencyContactDto } from './dto/create-emergency-contact.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class EmergencyContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(patientId: string, dto: CreateEmergencyContactDto, performedBy: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId, isActive: true },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with id "${patientId}" not found`);
    }

    const contact = await this.prisma.emergencyContact.create({
      data: { patientId, ...dto },
    });

    await this.auditService.log({
      entityType: 'EmergencyContact',
      entityId: contact.id,
      action: AuditAction.CREATE,
      performedBy,
      metadata: { patientId },
    });

    return { message: 'Emergency contact added successfully', contact };
  }

  async findByPatient(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId, isActive: true },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with id "${patientId}" not found`);
    }

    const contacts = await this.prisma.emergencyContact.findMany({
      where: { patientId },
    });

    return { contacts, total: contacts.length };
  }
}
