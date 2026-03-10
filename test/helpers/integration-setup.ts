/**
 * Integration test database helpers.
 *
 * Loads .env.test, pushes Prisma schema to the test DB, and provides
 * helpers to clear all tables between tests so each test starts fresh.
 *
 * Usage:
 *   beforeAll(() => setupIntegrationDb());
 *   afterEach(() => clearDatabase(prisma));
 *   afterAll(() => teardownIntegrationDb());
 */

import { config } from 'dotenv';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

// Load .env.test overrides BEFORE anything else
config({ path: '.env.test', override: true });

let prismaClient: PrismaClient;

/**
 * Pushes the current Prisma schema to the test DB via `prisma db push`.
 * Safe to call in beforeAll — idempotent if schema hasn't changed.
 */
export function setupIntegrationDb(): void {
  console.log('🔧  Pushing Prisma schema to test database...');
  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });
}

/** Returns a shared PrismaClient connected to the test DB */
export function getIntegrationPrisma(): PrismaClient {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } },
    });
  }
  return prismaClient;
}

/**
 * Deletes all rows from every table in the correct dependency order.
 * Call in afterEach to keep tests independent.
 */
export async function clearDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.prescribedMedicine.deleteMany(),
    prisma.prescription.deleteMany(),
    prisma.labReport.deleteMany(),
    prisma.vitalSigns.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.visit.deleteMany(),
    prisma.consent.deleteMany(),
    prisma.medicalSnapshot.deleteMany(),
    prisma.insurance.deleteMany(),
    prisma.emergencyContact.deleteMany(),
    prisma.patient.deleteMany(),
    prisma.doctorSlot.deleteMany(),
    prisma.doctor.deleteMany(),
    prisma.otp.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

/** Disconnects PrismaClient. Call in afterAll. */
export async function teardownIntegrationDb(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect();
  }
}
