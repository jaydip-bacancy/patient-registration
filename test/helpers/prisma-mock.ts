/**
 * Shared Prisma mock factory.
 * Returns a deeply-mocked object that mirrors every PrismaService method
 * used across the codebase. Each method is a jest.fn() returning undefined
 * by default — override with mockResolvedValue / mockRejectedValue in tests.
 */
export const createPrismaMock = () => ({
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
  },
  otp: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  patient: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  emergencyContact: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  insurance: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  medicalSnapshot: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  consent: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  visit: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  vitalSigns: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  doctor: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  doctorSlot: {
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
  },
  appointment: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  prescription: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  prescribedMedicine: {
    createMany: jest.fn(),
  },
  labReport: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  auditLog: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
});

export type PrismaMock = ReturnType<typeof createPrismaMock>;
