import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, createPrismaMock } from '../helpers/app-bootstrap';
import { mockPatientUser, mockOtp } from '../helpers/fixtures';
import { OtpStatus, Role } from '@prisma/client';

describe('Auth — E2E', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeAll(async () => {
    prisma = createPrismaMock();
    app = await createTestApp(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => jest.clearAllMocks());

  // ── POST /auth/send-otp ────────────────────────────────────────────────────

  describe('POST /api/v1/auth/send-otp', () => {
    it('returns 400 when email is not registered', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ email: 'unknown@example.com' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not registered');
    });

    it('returns 200 when email already exists (sends OTP)', async () => {
      prisma.user.findUnique.mockResolvedValue(mockPatientUser);
      prisma.otp.updateMany.mockResolvedValue({ count: 1 });
      prisma.otp.create.mockResolvedValue(mockOtp);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ email: 'user@example.com' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('returns 400 when email is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(400);
    });

    it('returns 400 when email format is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /auth/verify-otp ──────────────────────────────────────────────────

  describe('POST /api/v1/auth/verify-otp', () => {
    it('returns 200 with accessToken and refreshToken on valid OTP', async () => {
      prisma.user.findUnique.mockResolvedValue(mockPatientUser);
      prisma.otp.findFirst.mockResolvedValue(mockOtp);
      prisma.$transaction.mockResolvedValue([]);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ email: 'user@example.com', otp: '482910' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.role).toBe(Role.PATIENT);
    });

    it('returns 401 when OTP is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue(mockPatientUser);
      prisma.otp.findFirst.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ email: 'user@example.com', otp: '000000' })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid or expired OTP');
    });

    it('returns 401 when email is not registered', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ email: 'user@example.com', otp: '123456' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('returns 400 when OTP length is not 6', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ email: 'user@example.com', otp: '123' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /auth/refresh ─────────────────────────────────────────────────────

  describe('POST /api/v1/auth/refresh', () => {
    it('returns 401 when refresh token is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'bad.token.here' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
