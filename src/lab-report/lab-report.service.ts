import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabReportDto } from './dto/create-lab-report.dto';
import { UpdateLabReportDto } from './dto/update-lab-report.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, LabReportStatus } from '@prisma/client';

@Injectable()
export class LabReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateLabReportDto, performedBy: string) {
    const visit = await this.prisma.visit.findUnique({ where: { id: dto.visitId } });
    if (!visit) {
      throw new NotFoundException(`Visit with id "${dto.visitId}" not found`);
    }

    const labReport = await this.prisma.labReport.create({
      data: {
        patientId: dto.patientId,
        visitId: dto.visitId,
        orderedBy: performedBy,
        testName: dto.testName,
        labName: dto.labName,
        reportUrl: dto.reportUrl,
        reportNotes: dto.reportNotes,
        status: LabReportStatus.ORDERED,
      },
      include: {
        patient: { select: { uhid: true, firstName: true, lastName: true } },
        visit: { select: { id: true, visitType: true, visitDate: true } },
      },
    });

    await this.auditService.log({
      entityType: 'LabReport',
      entityId: labReport.id,
      action: AuditAction.CREATE,
      performedBy,
      metadata: { patientId: dto.patientId, visitId: dto.visitId, testName: dto.testName },
    });

    return { message: 'Lab report ordered successfully', labReport };
  }

  async updateStatus(id: string, dto: UpdateLabReportDto, performedBy: string) {
    const existing = await this.prisma.labReport.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Lab report with id "${id}" not found`);
    }

    const data: Record<string, unknown> = {};
    if (dto.status) data.status = dto.status;
    if (dto.reportUrl !== undefined) data.reportUrl = dto.reportUrl;
    if (dto.reportNotes !== undefined) data.reportNotes = dto.reportNotes;

    if (dto.status === LabReportStatus.SAMPLE_COLLECTED) {
      data.collectedAt = new Date();
    }
    if (dto.status === LabReportStatus.COMPLETED) {
      data.completedAt = new Date();
    }

    const labReport = await this.prisma.labReport.update({
      where: { id },
      data,
      include: {
        patient: { select: { uhid: true, firstName: true, lastName: true } },
      },
    });

    await this.auditService.log({
      entityType: 'LabReport',
      entityId: id,
      action: AuditAction.UPDATE,
      performedBy,
      metadata: { previousStatus: existing.status, newStatus: dto.status },
    });

    return { message: 'Lab report updated successfully', labReport };
  }

  async findById(id: string) {
    const labReport = await this.prisma.labReport.findUnique({
      where: { id },
      include: {
        patient: { select: { uhid: true, firstName: true, lastName: true } },
        visit: { select: { id: true, visitType: true, visitDate: true, department: true } },
      },
    });

    if (!labReport) {
      throw new NotFoundException(`Lab report with id "${id}" not found`);
    }

    return labReport;
  }

  async findByPatient(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId, isActive: true },
    });
    if (!patient) {
      throw new NotFoundException(`Patient with id "${patientId}" not found`);
    }

    const labReports = await this.prisma.labReport.findMany({
      where: { patientId },
      include: {
        visit: { select: { id: true, visitType: true, visitDate: true } },
      },
      orderBy: { orderedAt: 'desc' },
    });

    return { labReports, total: labReports.length };
  }

  async findByVisit(visitId: string) {
    const visit = await this.prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit) {
      throw new NotFoundException(`Visit with id "${visitId}" not found`);
    }

    const labReports = await this.prisma.labReport.findMany({
      where: { visitId },
      orderBy: { orderedAt: 'desc' },
    });

    return { labReports, total: labReports.length };
  }
}
