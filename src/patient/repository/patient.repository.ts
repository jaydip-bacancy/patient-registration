import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterPatientDto } from '../dto/register-patient.dto';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class PatientRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPhone(phone: string) {
    return this.prisma.patient.findUnique({ where: { phone, isActive: true } });
  }

  async findById(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id, isActive: true },
      include: {
        emergencyContacts: true,
        insurances: true,
        medicalSnapshot: true,
        consent: true,
      },
    });
    if (!patient) throw new NotFoundException(`Patient with id "${id}" not found`);
    return patient;
  }

  async findByUhid(uhid: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { uhid },
    });
    if (!patient || !patient.isActive) {
      throw new NotFoundException(`Patient with UHID "${uhid}" not found`);
    }
    return patient;
  }

  async create(
    dto: RegisterPatientDto,
    uhid: string,
    createdBy: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;

    const existingPatient = await client.patient.findUnique({ where: { phone: dto.phone } });
    if (existingPatient) {
      throw new ConflictException(`Patient with phone ${dto.phone} already exists`);
    }

    const existingUser = await client.user.findUnique({ where: { email: dto.email } });
    if (existingUser) {
      throw new ConflictException(`User with email ${dto.email} already exists`);
    }

    await client.user.create({
      data: { email: dto.email, role: Role.PATIENT, isVerified: true },
    });

    return client.patient.create({
      data: {
        ...dto,
        dob: new Date(dto.dob),
        uhid,
        createdBy,
      },
    });
  }

  async softDelete(id: string) {
    return this.prisma.patient.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async searchByPhone(phone: string) {
    return this.prisma.patient.findMany({
      where: {
        phone: { contains: phone },
        isActive: true,
      },
      take: 20,
    });
  }
}
