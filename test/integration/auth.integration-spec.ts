/**
 * Auth — Integration Tests
 *
 * These tests run against a real PostgreSQL test database (patient-system-test).
 * They exercise the full Prisma → DB round-trip with NO mocks.
 *
 * Prerequisites:
 *   1. PostgreSQL running locally
 *   2. .env.test configured with DATABASE_URL pointing to patient-system-test
 *   3. Run: npx prisma migrate deploy (done automatically by setupIntegrationDb)
 */

import { PrismaClient } from '@prisma/client';
import {
  setupIntegrationDb,
  getIntegrationPrisma,
  clearDatabase,
  teardownIntegrationDb,
} from '../helpers/integration-setup';

describe('Auth — Integration', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    setupIntegrationDb();
    prisma = getIntegrationPrisma();
  });

  afterEach(async () => clearDatabase(prisma));

  afterAll(async () => teardownIntegrationDb());

  // ── User creation (email-based) ─────────────────────────────────────────────

  describe('User creation', () => {
    it('creates a PATIENT user with email', async () => {
      await prisma.user.create({
        data: { email: 'patient@example.com', role: 'PATIENT' },
      });

      const user = await prisma.user.findUnique({ where: { email: 'patient@example.com' } });

      expect(user).not.toBeNull();
      expect(user!.role).toBe('PATIENT');
      expect(user!.isVerified).toBe(false);
    });

    it('does not allow duplicate emails', async () => {
      await prisma.user.create({ data: { email: 'patient@example.com', role: 'PATIENT' } });

      await expect(
        prisma.user.create({ data: { email: 'patient@example.com', role: 'PATIENT' } }),
      ).rejects.toThrow();
    });
  });

  // ── OTP lifecycle ──────────────────────────────────────────────────────────

  describe('OTP lifecycle', () => {
    it('stores a PENDING OTP for the user', async () => {
      const user = await prisma.user.create({ data: { email: 'patient@example.com', role: 'PATIENT' } });

      await prisma.otp.create({
        data: {
          userId: user.id,
          code: '482910',
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      const otp = await prisma.otp.findFirst({ where: { userId: user.id } });
      expect(otp!.status).toBe('PENDING');
      expect(otp!.code).toBe('482910');
    });

    it('expires previous OTPs when a new one is requested', async () => {
      const user = await prisma.user.create({ data: { email: 'patient@example.com', role: 'PATIENT' } });

      // Create initial OTP
      await prisma.otp.create({
        data: { userId: user.id, code: '111111', status: 'PENDING', expiresAt: new Date(Date.now() + 5 * 60_000) },
      });

      // Expire it
      await prisma.otp.updateMany({
        where: { userId: user.id, status: 'PENDING' },
        data: { status: 'EXPIRED' },
      });

      // Create new OTP
      await prisma.otp.create({
        data: { userId: user.id, code: '222222', status: 'PENDING', expiresAt: new Date(Date.now() + 5 * 60_000) },
      });

      const pendingOtps = await prisma.otp.findMany({ where: { userId: user.id, status: 'PENDING' } });
      expect(pendingOtps).toHaveLength(1);
      expect(pendingOtps[0].code).toBe('222222');
    });

    it('marks user as isVerified after OTP is consumed', async () => {
      const user = await prisma.user.create({ data: { email: 'patient@example.com', role: 'PATIENT' } });
      const otp = await prisma.otp.create({
        data: { userId: user.id, code: '482910', status: 'PENDING', expiresAt: new Date(Date.now() + 5 * 60_000) },
      });

      await prisma.$transaction([
        prisma.otp.update({ where: { id: otp.id }, data: { status: 'VERIFIED' } }),
        prisma.user.update({ where: { id: user.id }, data: { isVerified: true } }),
      ]);

      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
      const updatedOtp = await prisma.otp.findUnique({ where: { id: otp.id } });

      expect(updatedUser!.isVerified).toBe(true);
      expect(updatedOtp!.status).toBe('VERIFIED');
    });

    it('does not find an expired OTP when verifying', async () => {
      const user = await prisma.user.create({ data: { email: 'patient@example.com', role: 'PATIENT' } });

      await prisma.otp.create({
        data: {
          userId: user.id,
          code: '482910',
          status: 'PENDING',
          expiresAt: new Date(Date.now() - 60_000), // already expired
        },
      });

      const otpRecord = await prisma.otp.findFirst({
        where: {
          userId: user.id,
          code: '482910',
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
      });

      expect(otpRecord).toBeNull();
    });
  });
});
