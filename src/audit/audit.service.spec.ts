import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../../test/helpers/prisma-mock';
import { AuditAction } from '@prisma/client';

const logPayload = {
  entityType: 'Patient',
  entityId: 'patient-uuid-001',
  action: AuditAction.CREATE,
  performedBy: 'staff-uuid-001',
  metadata: { uhid: 'UHID-26-000001' },
};

describe('AuditService', () => {
  let service: AuditService;
  let prismaMock: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('log', () => {
    it('creates an audit log entry with correct fields', async () => {
      prismaMock.auditLog.create.mockResolvedValue({ id: 'log-uuid', ...logPayload, timestamp: new Date() });

      await service.log(logPayload);

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'Patient',
          entityId: 'patient-uuid-001',
          action: AuditAction.CREATE,
          performedBy: 'staff-uuid-001',
        }),
      });
    });

    it('does NOT throw when the DB write fails (audit must never crash operations)', async () => {
      prismaMock.auditLog.create.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.log(logPayload)).resolves.not.toThrow();
    });

    it('uses empty object as default metadata when none is provided', async () => {
      prismaMock.auditLog.create.mockResolvedValue({} as never);

      await service.log({ ...logPayload, metadata: undefined });

      expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ metadata: {} }),
      });
    });
  });

  describe('findAll', () => {
    it('returns paginated logs with total count', async () => {
      const logs = [{ id: 'log-1' }, { id: 'log-2' }];
      prismaMock.auditLog.findMany.mockResolvedValue(logs as never);
      prismaMock.auditLog.count.mockResolvedValue(2);

      const result = await service.findAll(10, 0);

      expect(result.logs).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });
  });

  describe('findByEntity', () => {
    it('returns logs filtered by entityType and entityId', async () => {
      prismaMock.auditLog.findMany.mockResolvedValue([{ id: 'log-1' }] as never);

      const result = await service.findByEntity('Patient', 'patient-uuid-001');

      expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { entityType: 'Patient', entityId: 'patient-uuid-001' },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });
});
