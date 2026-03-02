import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class VisitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateVisitDto, performedBy: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId, isActive: true },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with id "${dto.patientId}" not found`);
    }

    const visit = await this.prisma.visit.create({
      data: {
        ...dto,
        visitDate: new Date(dto.visitDate),
      },
      include: { patient: { select: { uhid: true, firstName: true, lastName: true } } },
    });

    await this.auditService.log({
      entityType: 'Visit',
      entityId: visit.id,
      action: AuditAction.CREATE,
      performedBy,
      metadata: {
        patientId: dto.patientId,
        visitType: visit.visitType,
        department: visit.department,
      },
    });

    return { message: 'Visit created successfully', visit };
  }

  async findByPatient(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId, isActive: true },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with id "${patientId}" not found`);
    }

    const visits = await this.prisma.visit.findMany({
      where: { patientId },
      orderBy: { visitDate: 'desc' },
    });

    return { visits, total: visits.length };
  }

  async findById(id: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id },
      include: { patient: { select: { uhid: true, firstName: true, lastName: true } } },
    });

    if (!visit) {
      throw new NotFoundException(`Visit with id "${id}" not found`);
    }

    return visit;
  }
}
