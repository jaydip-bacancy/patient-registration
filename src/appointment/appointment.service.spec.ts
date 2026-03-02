import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { createPrismaMock } from '../../test/helpers/prisma-mock';
import {
  mockPatient,
  mockDoctor,
  mockAppointment,
  mockAppointmentWithRelations,
  createAppointmentDto,
} from '../../test/helpers/fixtures';
import { AppointmentStatus } from '@prisma/client';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let prismaMock: ReturnType<typeof createPrismaMock>;
  let auditMock: jest.Mocked<AuditService>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    auditMock = { log: jest.fn() } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('books an appointment and returns it with patient/doctor relations', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(mockPatient);
      prismaMock.doctor.findUnique.mockResolvedValue(mockDoctor);
      prismaMock.appointment.findFirst.mockResolvedValue(null);
      prismaMock.appointment.create.mockResolvedValue(mockAppointmentWithRelations as never);

      const result = await service.create(createAppointmentDto as never, 'staff-uuid');

      expect(result.message).toBe('Appointment booked successfully');
      expect(result.appointment.patient.uhid).toBe('UHID-26-482910');
      expect(auditMock.log).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when patient does not exist', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(null);

      await expect(
        service.create(createAppointmentDto as never, 'staff-uuid'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when doctor does not exist', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(mockPatient);
      prismaMock.doctor.findUnique.mockResolvedValue(null);

      await expect(
        service.create(createAppointmentDto as never, 'staff-uuid'),
      ).rejects.toThrow(new NotFoundException(`Doctor with id "${mockDoctor.id}" not found`));
    });

    it('throws ConflictException when the slot is already booked', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(mockPatient);
      prismaMock.doctor.findUnique.mockResolvedValue(mockDoctor);
      prismaMock.appointment.findFirst.mockResolvedValue(mockAppointment as never);

      await expect(
        service.create(createAppointmentDto as never, 'staff-uuid'),
      ).rejects.toThrow(ConflictException);
    });

    it('does NOT throw ConflictException when existing booking is CANCELLED', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(mockPatient);
      prismaMock.doctor.findUnique.mockResolvedValue(mockDoctor);
      prismaMock.appointment.findFirst.mockResolvedValue(null); // cancelled = excluded by query
      prismaMock.appointment.create.mockResolvedValue(mockAppointmentWithRelations as never);

      await expect(
        service.create(createAppointmentDto as never, 'staff-uuid'),
      ).resolves.not.toThrow();
    });
  });

  // ── updateStatus ───────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('confirms a pending appointment', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue(mockAppointment as never);
      prismaMock.appointment.update.mockResolvedValue({
        ...mockAppointmentWithRelations,
        status: AppointmentStatus.CONFIRMED,
      } as never);

      const result = await service.updateStatus(
        mockAppointment.id,
        { status: AppointmentStatus.CONFIRMED },
        'staff-uuid',
      );

      expect(result.message).toBe('Appointment status updated');
      expect(result.appointment.status).toBe(AppointmentStatus.CONFIRMED);
    });

    it('throws BadRequestException when cancelling without a reason', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue(mockAppointment as never);

      await expect(
        service.updateStatus(
          mockAppointment.id,
          { status: AppointmentStatus.CANCELLED },
          'staff-uuid',
        ),
      ).rejects.toThrow(new BadRequestException('cancelReason is required when cancelling an appointment'));
    });

    it('cancels an appointment when cancelReason is provided', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue(mockAppointment as never);
      prismaMock.appointment.update.mockResolvedValue({
        ...mockAppointmentWithRelations,
        status: AppointmentStatus.CANCELLED,
        cancelReason: 'Patient requested',
      } as never);

      const result = await service.updateStatus(
        mockAppointment.id,
        { status: AppointmentStatus.CANCELLED, cancelReason: 'Patient requested' },
        'staff-uuid',
      );

      expect(result.appointment.status).toBe(AppointmentStatus.CANCELLED);
    });

    it('throws BadRequestException when updating a completed appointment', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
      } as never);

      await expect(
        service.updateStatus(
          mockAppointment.id,
          { status: AppointmentStatus.CONFIRMED },
          'staff-uuid',
        ),
      ).rejects.toThrow(new BadRequestException('Cannot update a completed appointment'));
    });

    it('throws BadRequestException when updating a cancelled appointment', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue({
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
      } as never);

      await expect(
        service.updateStatus(
          mockAppointment.id,
          { status: AppointmentStatus.CONFIRMED },
          'staff-uuid',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when appointment does not exist', async () => {
      prismaMock.appointment.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('bad-id', { status: AppointmentStatus.CONFIRMED }, 'staff-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── findByPatient ──────────────────────────────────────────────────────────

  describe('findByPatient', () => {
    it('returns appointments with total count', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(mockPatient);
      prismaMock.appointment.findMany.mockResolvedValue([mockAppointmentWithRelations as never]);

      const result = await service.findByPatient(mockPatient.id);

      expect(result.appointments).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('throws NotFoundException when patient is inactive or missing', async () => {
      prismaMock.patient.findUnique.mockResolvedValue(null);

      await expect(service.findByPatient('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── findByDoctor ───────────────────────────────────────────────────────────

  describe('findByDoctor', () => {
    it("returns doctor's appointments ordered by date and time", async () => {
      prismaMock.doctor.findUnique.mockResolvedValue(mockDoctor);
      prismaMock.appointment.findMany.mockResolvedValue([mockAppointmentWithRelations as never]);

      const result = await service.findByDoctor(mockDoctor.id);

      expect(result.appointments).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('filters appointments by date when date param is provided', async () => {
      prismaMock.doctor.findUnique.mockResolvedValue(mockDoctor);
      prismaMock.appointment.findMany.mockResolvedValue([]);

      await service.findByDoctor(mockDoctor.id, '2026-03-15');

      expect(prismaMock.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            appointmentDate: expect.objectContaining({ gte: expect.any(Date) }),
          }),
        }),
      );
    });

    it('throws NotFoundException when doctor is inactive or missing', async () => {
      prismaMock.doctor.findUnique.mockResolvedValue(null);

      await expect(service.findByDoctor('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
