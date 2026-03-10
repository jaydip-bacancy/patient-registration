/**
 * Patient — Integration Tests
 *
 * Exercises the full Prisma → PostgreSQL stack for patient operations.
 * All tests run against a real test database and are fully isolated via
 * clearDatabase() between each test.
 */

import { PrismaClient } from '@prisma/client';
import {
  setupIntegrationDb,
  getIntegrationPrisma,
  clearDatabase,
  teardownIntegrationDb,
} from '../helpers/integration-setup';

describe('Patient — Integration', () => {
  let prisma: PrismaClient;
  let adminUserId: string;

  beforeAll(() => {
    setupIntegrationDb();
    prisma = getIntegrationPrisma();
  });

  beforeEach(async () => {
    const admin = await prisma.user.create({
      data: { email: 'admin@test.com', role: 'ADMIN', isVerified: true },
    });
    adminUserId = admin.id;
  });

  afterEach(async () => clearDatabase(prisma));

  afterAll(async () => teardownIntegrationDb());

  // ── Patient creation ───────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a patient with UHID and returns it', async () => {
      const patient = await prisma.patient.create({
        data: {
          uhid: 'UHID-26-100001',
          firstName: 'Raj',
          lastName: 'Sharma',
          dob: new Date('1990-05-15'),
          gender: 'MALE',
          phone: '+919876543210',
          createdBy: adminUserId,
        },
      });

      expect(patient.id).toBeDefined();
      expect(patient.uhid).toBe('UHID-26-100001');
      expect(patient.isActive).toBe(true);
    });

    it('enforces unique phone constraint', async () => {
      await prisma.patient.create({
        data: {
          uhid: 'UHID-26-100001',
          firstName: 'Raj',
          lastName: 'Sharma',
          dob: new Date('1990-05-15'),
          gender: 'MALE',
          phone: '+919876543210',
          createdBy: adminUserId,
        },
      });

      await expect(
        prisma.patient.create({
          data: {
            uhid: 'UHID-26-100002',
            firstName: 'Raj2',
            lastName: 'Sharma2',
            dob: new Date('1992-01-01'),
            gender: 'FEMALE',
            phone: '+919876543210', // duplicate
            createdBy: adminUserId,
          },
        }),
      ).rejects.toThrow();
    });

    it('creates patient with emergency contact in a transaction', async () => {
      await prisma.$transaction(async (tx) => {
        const patient = await tx.patient.create({
          data: {
            uhid: 'UHID-26-100003',
            firstName: 'Priya',
            lastName: 'Mehta',
            dob: new Date('1985-08-20'),
            gender: 'FEMALE',
            phone: '+919876543211',
            createdBy: adminUserId,
          },
        });

        await tx.emergencyContact.create({
          data: {
            patientId: patient.id,
            name: 'Arjun Mehta',
            relation: 'Spouse',
            phone: '+919876543212',
          },
        });

        return patient;
      });

      const patient = await prisma.patient.findUnique({
        where: { phone: '+919876543211' },
        include: { emergencyContacts: true },
      });

      expect(patient!.emergencyContacts).toHaveLength(1);
      expect(patient!.emergencyContacts[0].relation).toBe('Spouse');
    });
  });

  // ── Soft delete ────────────────────────────────────────────────────────────

  describe('softDelete', () => {
    it('sets isActive=false and excludes patient from active queries', async () => {
      const patient = await prisma.patient.create({
        data: {
          uhid: 'UHID-26-100004',
          firstName: 'Test',
          lastName: 'User',
          dob: new Date('2000-01-01'),
          gender: 'MALE',
          phone: '+919876543215',
          createdBy: adminUserId,
        },
      });

      await prisma.patient.update({ where: { id: patient.id }, data: { isActive: false } });

      const result = await prisma.patient.findUnique({
        where: { id: patient.id, isActive: true },
      });

      expect(result).toBeNull();
    });
  });

  // ── Audit log ──────────────────────────────────────────────────────────────

  describe('audit log', () => {
    it('creates an audit entry for patient registration', async () => {
      const patient = await prisma.patient.create({
        data: {
          uhid: 'UHID-26-100005',
          firstName: 'Audit',
          lastName: 'Test',
          dob: new Date('1995-03-10'),
          gender: 'FEMALE',
          phone: '+919876543216',
          createdBy: adminUserId,
        },
      });

      await prisma.auditLog.create({
        data: {
          entityType: 'Patient',
          entityId: patient.id,
          action: 'CREATE',
          performedBy: adminUserId,
          metadata: { uhid: patient.uhid },
        },
      });

      const logs = await prisma.auditLog.findMany({ where: { entityId: patient.id } });

      expect(logs).toHaveLength(1);
      expect(logs[0].action).toBe('CREATE');
    });
  });

  // ── Phone search ───────────────────────────────────────────────────────────

  describe('searchByPhone', () => {
    it('returns patients matching a partial phone number', async () => {
      await prisma.patient.create({
        data: {
          uhid: 'UHID-26-100006',
          firstName: 'Search',
          lastName: 'Test',
          dob: new Date('1995-03-10'),
          gender: 'MALE',
          phone: '+919900001234',
          createdBy: adminUserId,
        },
      });
      await prisma.patient.create({
        data: {
          uhid: 'UHID-26-100007',
          firstName: 'Search2',
          lastName: 'Test2',
          dob: new Date('1996-04-11'),
          gender: 'FEMALE',
          phone: '+919900005678',
          createdBy: adminUserId,
        },
      });

      const results = await prisma.patient.findMany({
        where: { phone: { contains: '+91990000' }, isActive: true },
        take: 20,
      });

      expect(results).toHaveLength(2);
    });
  });
});
