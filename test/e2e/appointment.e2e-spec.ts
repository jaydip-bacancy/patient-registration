import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, createPrismaMock } from '../helpers/app-bootstrap';
import {
  mockStaffUser,
  mockPatient,
  mockDoctor,
  mockAppointment,
  mockAppointmentWithRelations,
  createAppointmentDto,
} from '../helpers/fixtures';
import { generateTestToken } from '../helpers/jwt-token-factory';
import { AppointmentStatus } from '@prisma/client';

describe('Appointment — E2E', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof createPrismaMock>;
  let staffToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-for-testing';

    prisma = createPrismaMock();
    app = await createTestApp(prisma);

    staffToken = generateTestToken(mockStaffUser.id, mockStaffUser.phone, mockStaffUser.role);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue(mockStaffUser);
    prisma.auditLog.create.mockResolvedValue({} as never);
  });

  afterEach(() => jest.clearAllMocks());

  // ── POST /appointments ─────────────────────────────────────────────────────

  describe('POST /api/v1/appointments', () => {
    it('creates an appointment and returns 201', async () => {
      prisma.patient.findUnique.mockResolvedValue(mockPatient);
      prisma.doctor.findUnique.mockResolvedValue(mockDoctor);
      prisma.appointment.findFirst.mockResolvedValue(null);
      prisma.appointment.create.mockResolvedValue(mockAppointmentWithRelations as never);

      const res = await request(app.getHttpServer())
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(createAppointmentDto)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.appointment.patient.uhid).toBe('UHID-26-482910');
    });

    it('returns 404 when patient does not exist', async () => {
      prisma.patient.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(createAppointmentDto)
        .expect(404);

      expect(res.body.success).toBe(false);
    });

    it('returns 409 when slot is already booked', async () => {
      prisma.patient.findUnique.mockResolvedValue(mockPatient);
      prisma.doctor.findUnique.mockResolvedValue(mockDoctor);
      prisma.appointment.findFirst.mockResolvedValue(mockAppointment as never);

      const res = await request(app.getHttpServer())
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(createAppointmentDto)
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('returns 401 when unauthenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/appointments')
        .send(createAppointmentDto)
        .expect(401);
    });
  });

  // ── PATCH /appointments/:id/status ────────────────────────────────────────

  describe('PATCH /api/v1/appointments/:id/status', () => {
    it('confirms a pending appointment', async () => {
      prisma.appointment.findUnique.mockResolvedValue(mockAppointment as never);
      prisma.appointment.update.mockResolvedValue({
        ...mockAppointmentWithRelations,
        status: AppointmentStatus.CONFIRMED,
      } as never);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/appointments/${mockAppointment.id}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: AppointmentStatus.CONFIRMED })
        .expect(200);

      expect(res.body.data.appointment.status).toBe(AppointmentStatus.CONFIRMED);
    });

    it('returns 400 when cancelling without a reason', async () => {
      prisma.appointment.findUnique.mockResolvedValue(mockAppointment as never);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/appointments/${mockAppointment.id}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: AppointmentStatus.CANCELLED })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /patients/:patientId/appointments ──────────────────────────────────

  describe('GET /api/v1/patients/:patientId/appointments', () => {
    it("returns a patient's appointment list", async () => {
      prisma.patient.findUnique.mockResolvedValue(mockPatient);
      prisma.appointment.findMany.mockResolvedValue([mockAppointmentWithRelations as never]);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/patients/${mockPatient.id}/appointments`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(res.body.data.total).toBe(1);
    });
  });
});
