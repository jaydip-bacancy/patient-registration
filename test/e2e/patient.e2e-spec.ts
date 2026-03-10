import { INestApplication, ConflictException } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, createPrismaMock } from '../helpers/app-bootstrap';
import {
  mockAdminUser,
  mockPatientUser,
  mockPatient,
  mockPatientFull,
  registerPatientDto,
} from '../helpers/fixtures';
import { generateTestToken } from '../helpers/jwt-token-factory';

describe('Patient — E2E', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof createPrismaMock>;
  let adminToken: string;
  let patientToken: string;

  beforeAll(async () => {
    // Ensure test uses the test secret
    process.env.JWT_SECRET = 'test-secret-for-testing';

    prisma = createPrismaMock();
    app = await createTestApp(prisma);

    adminToken = generateTestToken(mockAdminUser.id, mockAdminUser.email, mockAdminUser.role);
    patientToken = generateTestToken(mockPatientUser.id, mockPatientUser.email, mockPatientUser.role);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // JwtStrategy calls user.findUnique to validate the token on each request
    prisma.user.findUnique.mockImplementation(({ where }) => {
      if (where?.id === mockAdminUser.id) return Promise.resolve(mockAdminUser);
      if (where?.id === mockPatientUser.id) return Promise.resolve(mockPatientUser);
      return Promise.resolve(null);
    });
  });

  afterEach(() => jest.clearAllMocks());

  // ── POST /patients/register ─────────────────────────────────────────────────

  describe('POST /api/v1/patients/register', () => {
    it('registers a patient and returns 201 with UHID', async () => {
      prisma.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(prisma));
      prisma.patient.findUnique.mockResolvedValueOnce(null);
      prisma.user.findUnique.mockResolvedValueOnce(null); // no existing user
      prisma.user.create.mockResolvedValue({ id: 'new-user-id', email: registerPatientDto.email } as never);
      prisma.patient.create.mockResolvedValue(mockPatient);
      prisma.auditLog.create.mockResolvedValue({} as never);

      const res = await request(app.getHttpServer())
        .post('/api/v1/patients/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(registerPatientDto)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.patient.firstName).toBe('Raj');
    });

    it('returns 409 when phone already exists', async () => {
      prisma.$transaction.mockRejectedValue(
        new ConflictException('Patient with phone +919876543210 already exists'),
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/patients/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(registerPatientDto)
        .expect(409);

      expect(res.body.success).toBe(false);
    });

    it('succeeds without token (register is public)', async () => {
      prisma.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(prisma));
      prisma.patient.findUnique.mockResolvedValueOnce(null);
      prisma.user.findUnique.mockResolvedValueOnce(null);
      prisma.user.create.mockResolvedValue({ id: 'new-user-id' } as never);
      prisma.patient.create.mockResolvedValue(mockPatient);
      prisma.auditLog.create.mockResolvedValue({} as never);

      const res = await request(app.getHttpServer())
        .post('/api/v1/patients/register')
        .send(registerPatientDto)
        .expect(201);
      expect(res.body.success).toBe(true);
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/patients/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Raj' }) // missing required fields
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /patients/:id ──────────────────────────────────────────────────────

  describe('GET /api/v1/patients/:id', () => {
    it('returns the full patient profile', async () => {
      prisma.patient.findUnique.mockResolvedValue(mockPatientFull as never);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/patients/${mockPatient.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(mockPatient.id);
      expect(res.body.data.emergencyContacts).toHaveLength(1);
    });

    it('returns 404 when patient not found', async () => {
      prisma.patient.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .get('/api/v1/patients/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /patients/search ───────────────────────────────────────────────────

  describe('GET /api/v1/patients/search?phone=', () => {
    it('returns matching patients', async () => {
      prisma.patient.findMany.mockResolvedValue([mockPatient]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/patients/search?phone=+9198765')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(1);
    });
  });

  // ── DELETE /patients/:id ───────────────────────────────────────────────────

  describe('DELETE /api/v1/patients/:id', () => {
    it('soft-deletes a patient and returns 200', async () => {
      // findById inside softDelete
      prisma.patient.findUnique.mockResolvedValue(mockPatientFull as never);
      prisma.patient.update.mockResolvedValue({ ...mockPatient, isActive: false });
      prisma.auditLog.create.mockResolvedValue({} as never);

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/patients/${mockPatient.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Patient deactivated successfully');
    });

    it('returns 403 when non-ADMIN role tries to delete', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/patients/${mockPatient.id}`)
        .set('Authorization', `Bearer ${patientToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });
});
