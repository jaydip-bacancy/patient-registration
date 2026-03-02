import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class PrescriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreatePrescriptionDto, performedBy: string) {
    const visit = await this.prisma.visit.findUnique({ where: { id: dto.visitId } });
    if (!visit) {
      throw new NotFoundException(`Visit with id "${dto.visitId}" not found`);
    }

    const prescription = await this.prisma.$transaction(async (tx) => {
      const created = await tx.prescription.create({
        data: {
          visitId: dto.visitId,
          patientId: dto.patientId,
          doctorId: dto.doctorId,
          diagnosis: dto.diagnosis,
          notes: dto.notes,
          validTill: dto.followUpDate ? new Date(dto.followUpDate) : null,
          status: dto.status ?? 'ACTIVE',
        },
      });

      await tx.prescribedMedicine.createMany({
        data: dto.medicines.map((m) => ({
          prescriptionId: created.id,
          medicineName: m.medicineName,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions,
        })),
      });

      return tx.prescription.findUnique({
        where: { id: created.id },
        include: {
          medicines: true,
          patient: { select: { uhid: true, firstName: true, lastName: true } },
          doctor: { select: { firstName: true, lastName: true, specialization: true } },
        },
      });
    });

    await this.auditService.log({
      entityType: 'Prescription',
      entityId: prescription!.id,
      action: AuditAction.CREATE,
      performedBy,
      metadata: {
        visitId: dto.visitId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        medicineCount: dto.medicines.length,
      },
    });

    return { message: 'Prescription created successfully', prescription };
  }

  async findById(id: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        medicines: true,
        patient: { select: { uhid: true, firstName: true, lastName: true } },
        doctor: { select: { firstName: true, lastName: true, specialization: true } },
        visit: { select: { id: true, visitType: true, visitDate: true, department: true } },
      },
    });

    if (!prescription) {
      throw new NotFoundException(`Prescription with id "${id}" not found`);
    }

    return prescription;
  }

  async findByVisit(visitId: string) {
    const visit = await this.prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit) {
      throw new NotFoundException(`Visit with id "${visitId}" not found`);
    }

    const prescriptions = await this.prisma.prescription.findMany({
      where: { visitId },
      include: {
        medicines: true,
        doctor: { select: { firstName: true, lastName: true, specialization: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { prescriptions, total: prescriptions.length };
  }

  async findByPatient(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId, isActive: true },
    });
    if (!patient) {
      throw new NotFoundException(`Patient with id "${patientId}" not found`);
    }

    const prescriptions = await this.prisma.prescription.findMany({
      where: { patientId },
      include: {
        medicines: true,
        doctor: { select: { firstName: true, lastName: true, specialization: true } },
        visit: { select: { id: true, visitType: true, visitDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { prescriptions, total: prescriptions.length };
  }
}
