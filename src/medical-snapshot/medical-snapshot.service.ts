import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicalSnapshotDto } from './dto/create-medical-snapshot.dto';

@Injectable()
export class MedicalSnapshotService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(patientId: string, dto: CreateMedicalSnapshotDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId, isActive: true },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with id "${patientId}" not found`);
    }

    const snapshot = await this.prisma.medicalSnapshot.upsert({
      where: { patientId },
      update: {
        allergies: dto.allergies ?? [],
        chronicConditions: dto.chronicConditions ?? [],
        currentMedication: dto.currentMedication ?? [],
        pastSurgeries: dto.pastSurgeries ?? [],
      },
      create: {
        patientId,
        allergies: dto.allergies ?? [],
        chronicConditions: dto.chronicConditions ?? [],
        currentMedication: dto.currentMedication ?? [],
        pastSurgeries: dto.pastSurgeries ?? [],
      },
    });

    return { message: 'Medical snapshot saved successfully', snapshot };
  }

  async findByPatient(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId, isActive: true },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with id "${patientId}" not found`);
    }

    const snapshot = await this.prisma.medicalSnapshot.findUnique({ where: { patientId } });

    if (!snapshot) {
      throw new NotFoundException('Medical snapshot not yet recorded for this patient');
    }

    return snapshot;
  }
}
