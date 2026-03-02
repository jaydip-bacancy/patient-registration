import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecordVitalSignsDto } from './dto/record-vital-signs.dto';

@Injectable()
export class VitalSignsService {
  constructor(private readonly prisma: PrismaService) {}

  async record(dto: RecordVitalSignsDto) {
    const visit = await this.prisma.visit.findUnique({ where: { id: dto.visitId } });
    if (!visit) {
      throw new NotFoundException(`Visit with id "${dto.visitId}" not found`);
    }

    const existing = await this.prisma.vitalSigns.findUnique({
      where: { visitId: dto.visitId },
    });
    if (existing) {
      throw new BadRequestException(
        'Vital signs already recorded for this visit. Use PATCH to update.',
      );
    }

    const bmi = this.calculateBmi(dto.weight, dto.height);

    const vitalSigns = await this.prisma.vitalSigns.create({
      data: {
        visitId: dto.visitId,
        bloodPressure: dto.bloodPressure,
        pulseRate: dto.pulseRate,
        temperature: dto.temperature,
        weight: dto.weight,
        height: dto.height,
        bmi,
        oxygenSaturation: dto.oxygenSaturation,
        respiratoryRate: dto.respiratoryRate,
      },
    });

    return { message: 'Vital signs recorded successfully', vitalSigns };
  }

  async update(visitId: string, dto: Partial<RecordVitalSignsDto>) {
    const existing = await this.prisma.vitalSigns.findUnique({ where: { visitId } });
    if (!existing) {
      throw new NotFoundException(`No vital signs found for visit "${visitId}"`);
    }

    const weight = dto.weight ?? (existing.weight ? Number(existing.weight) : undefined);
    const height = dto.height ?? (existing.height ? Number(existing.height) : undefined);
    const bmi = this.calculateBmi(weight, height);

    const updated = await this.prisma.vitalSigns.update({
      where: { visitId },
      data: {
        ...(dto.bloodPressure !== undefined && { bloodPressure: dto.bloodPressure }),
        ...(dto.pulseRate !== undefined && { pulseRate: dto.pulseRate }),
        ...(dto.temperature !== undefined && { temperature: dto.temperature }),
        ...(dto.weight !== undefined && { weight: dto.weight }),
        ...(dto.height !== undefined && { height: dto.height }),
        ...(bmi !== null && { bmi }),
        ...(dto.oxygenSaturation !== undefined && { oxygenSaturation: dto.oxygenSaturation }),
        ...(dto.respiratoryRate !== undefined && { respiratoryRate: dto.respiratoryRate }),
      },
    });

    return { message: 'Vital signs updated successfully', vitalSigns: updated };
  }

  async findByVisit(visitId: string) {
    const vitalSigns = await this.prisma.vitalSigns.findUnique({ where: { visitId } });
    if (!vitalSigns) {
      throw new NotFoundException(`No vital signs recorded for visit "${visitId}"`);
    }
    return vitalSigns;
  }

  private calculateBmi(weight?: number, height?: number): number | null {
    if (!weight || !height || height === 0) return null;
    const heightM = height / 100;
    return Math.round((weight / (heightM * heightM)) * 10) / 10;
  }
}
