import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { CreateDoctorSlotDto } from './dto/create-doctor-slot.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class DoctorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateDoctorDto, performedBy: string) {
    const existingByReg = await this.prisma.doctor.findUnique({
      where: { registrationNo: dto.registrationNo },
    });
    if (existingByReg) {
      throw new ConflictException(
        `Doctor with registration number "${dto.registrationNo}" already exists`,
      );
    }

    const existingByPhone = await this.prisma.doctor.findFirst({
      where: { phone: dto.phone },
    });
    if (existingByPhone) {
      throw new ConflictException(
        `Doctor with phone "${dto.phone}" already exists`,
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException(`User with email "${dto.email}" already exists`);
    }

    const doctor = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: dto.email, role: Role.DOCTOR, isVerified: true },
      });
      return tx.doctor.create({
        data: {
          userId: user.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        specialization: dto.specialization,
        qualification: dto.qualification,
        registrationNo: dto.registrationNo,
        experienceYears: dto.experienceYears ?? 0,
        consultationFee: dto.consultationFee ?? 0,
        bio: dto.bio,
        languages: dto.languages ?? [],
      },
      });
    });

    await this.auditService.log({
      entityType: 'Doctor',
      entityId: doctor.id,
      action: AuditAction.CREATE,
      performedBy,
      metadata: { registrationNo: doctor.registrationNo, specialization: doctor.specialization },
    });

    return { message: 'Doctor profile created successfully', doctor };
  }

  async findAll(specialization?: string) {
    const where: Record<string, unknown> = { isActive: true };
    if (specialization) {
      where.specialization = { contains: specialization, mode: 'insensitive' };
    }

    const doctors = await this.prisma.doctor.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialization: true,
        qualification: true,
        experienceYears: true,
        consultationFee: true,
        bio: true,
        languages: true,
        phone: true,
        email: true,
      },
      orderBy: { firstName: 'asc' },
    });

    return { doctors, total: doctors.length };
  }

  async findById(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id, isActive: true },
      include: {
        slots: {
          where: { isActive: true },
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with id "${id}" not found`);
    }

    return doctor;
  }

  async addSlot(doctorId: string, dto: CreateDoctorSlotDto, performedBy: string) {
    await this.assertDoctorExists(doctorId);

    const slot = await this.prisma.doctorSlot.create({
      data: {
        doctorId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        slotDuration: dto.slotDuration ?? 15,
        isActive: dto.isActive ?? true,
      },
    });

    await this.auditService.log({
      entityType: 'DoctorSlot',
      entityId: slot.id,
      action: AuditAction.CREATE,
      performedBy,
      metadata: { doctorId, dayOfWeek: dto.dayOfWeek, startTime: dto.startTime },
    });

    return { message: 'Availability slot added successfully', slot };
  }

  async getSlots(doctorId: string) {
    await this.assertDoctorExists(doctorId);

    const slots = await this.prisma.doctorSlot.findMany({
      where: { doctorId, isActive: true },
      orderBy: { dayOfWeek: 'asc' },
    });

    return { slots, total: slots.length };
  }

  async getAvailableSlots(doctorId: string, date: string) {
    await this.assertDoctorExists(doctorId);

    const targetDate = new Date(date);
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayOfWeek = dayNames[targetDate.getDay()];

    const slots = await this.prisma.doctorSlot.findMany({
      where: { doctorId, dayOfWeek: dayOfWeek as never, isActive: true },
    });

    const bookedAppointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: {
          gte: new Date(`${date}T00:00:00.000Z`),
          lt: new Date(`${date}T23:59:59.999Z`),
        },
        status: { notIn: ['CANCELLED'] },
      },
      select: { startTime: true },
    });

    const bookedTimes = new Set(bookedAppointments.map((a) => a.startTime));

    const availableSlots = slots.flatMap((slot) => {
      const times = generateTimeSlots(slot.startTime, slot.endTime, slot.slotDuration);
      return times
        .filter((t) => !bookedTimes.has(t))
        .map((t) => ({ slotId: slot.id, time: t, duration: slot.slotDuration }));
    });

    return { date, availableSlots, total: availableSlots.length };
  }

  private async assertDoctorExists(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId, isActive: true },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with id "${doctorId}" not found`);
    }
    return doctor;
  }
}

function generateTimeSlots(start: string, end: string, durationMinutes: number): string[] {
  const slots: string[] = [];
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  let current = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  while (current + durationMinutes <= endTotal) {
    const h = Math.floor(current / 60).toString().padStart(2, '0');
    const m = (current % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
    current += durationMinutes;
  }

  return slots;
}
