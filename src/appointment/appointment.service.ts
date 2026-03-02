import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateAppointmentDto, performedBy: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId, isActive: true },
    });
    if (!patient) {
      throw new NotFoundException(`Patient with id "${dto.patientId}" not found`);
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId, isActive: true },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with id "${dto.doctorId}" not found`);
    }

    const conflict = await this.prisma.appointment.findFirst({
      where: {
        doctorId: dto.doctorId,
        appointmentDate: new Date(dto.appointmentDate),
        startTime: dto.startTime,
        status: { notIn: [AppointmentStatus.CANCELLED] },
      },
    });
    if (conflict) {
      throw new ConflictException(
        `Doctor already has an appointment at ${dto.startTime} on ${dto.appointmentDate}`,
      );
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        slotId: dto.slotId,
        appointmentDate: new Date(dto.appointmentDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        type: dto.type,
        reasonForVisit: dto.reasonForVisit,
        notes: dto.notes,
      },
      include: {
        patient: { select: { uhid: true, firstName: true, lastName: true, phone: true } },
        doctor: { select: { firstName: true, lastName: true, specialization: true } },
      },
    });

    await this.auditService.log({
      entityType: 'Appointment',
      entityId: appointment.id,
      action: AuditAction.CREATE,
      performedBy,
      metadata: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        appointmentDate: dto.appointmentDate,
        startTime: dto.startTime,
      },
    });

    return { message: 'Appointment booked successfully', appointment };
  }

  async updateStatus(id: string, dto: UpdateAppointmentStatusDto, performedBy: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      throw new NotFoundException(`Appointment with id "${id}" not found`);
    }

    if (
      appointment.status === AppointmentStatus.COMPLETED ||
      appointment.status === AppointmentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot update a ${appointment.status.toLowerCase()} appointment`,
      );
    }

    if (dto.status === AppointmentStatus.CANCELLED && !dto.cancelReason) {
      throw new BadRequestException('cancelReason is required when cancelling an appointment');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: dto.status,
        cancelReason: dto.cancelReason,
      },
      include: {
        patient: { select: { uhid: true, firstName: true, lastName: true } },
        doctor: { select: { firstName: true, lastName: true, specialization: true } },
      },
    });

    await this.auditService.log({
      entityType: 'Appointment',
      entityId: id,
      action: AuditAction.UPDATE,
      performedBy,
      metadata: { previousStatus: appointment.status, newStatus: dto.status },
    });

    return { message: 'Appointment status updated', appointment: updated };
  }

  async findById(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { select: { uhid: true, firstName: true, lastName: true, phone: true } },
        doctor: { select: { firstName: true, lastName: true, specialization: true } },
        slot: true,
        visit: { select: { id: true, visitType: true, visitDate: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with id "${id}" not found`);
    }

    return appointment;
  }

  async findByPatient(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId, isActive: true },
    });
    if (!patient) {
      throw new NotFoundException(`Patient with id "${patientId}" not found`);
    }

    const appointments = await this.prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: { select: { firstName: true, lastName: true, specialization: true } },
      },
      orderBy: { appointmentDate: 'desc' },
    });

    return { appointments, total: appointments.length };
  }

  async findByDoctor(doctorId: string, date?: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: doctorId, isActive: true },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with id "${doctorId}" not found`);
    }

    const where: Record<string, unknown> = { doctorId };
    if (date) {
      where.appointmentDate = {
        gte: new Date(`${date}T00:00:00.000Z`),
        lt: new Date(`${date}T23:59:59.999Z`),
      };
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      include: {
        patient: { select: { uhid: true, firstName: true, lastName: true, phone: true } },
      },
      orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
    });

    return { appointments, total: appointments.length };
  }
}
