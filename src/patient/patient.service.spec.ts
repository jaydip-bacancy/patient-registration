import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { PatientService } from './patient.service';
import { PatientRepository } from './repository/patient.repository';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { createPrismaMock } from '../../test/helpers/prisma-mock';
import { mockPatient, mockPatientFull, registerPatientDto } from '../../test/helpers/fixtures';

describe('PatientService', () => {
  let service: PatientService;
  let repositoryMock: jest.Mocked<PatientRepository>;
  let auditMock: jest.Mocked<AuditService>;
  let prismaMock: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    repositoryMock = {
      create: jest.fn(),
      findById: jest.fn(),
      findByPhone: jest.fn(),
      findByUhid: jest.fn(),
      softDelete: jest.fn(),
      searchByPhone: jest.fn(),
    } as unknown as jest.Mocked<PatientRepository>;

    auditMock = { log: jest.fn() } as unknown as jest.Mocked<AuditService>;

    // $transaction executes the callback with the prisma client
    prismaMock.$transaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(prismaMock));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: PatientRepository, useValue: repositoryMock },
        { provide: AuditService, useValue: auditMock },
      ],
    }).compile();

    service = module.get<PatientService>(PatientService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── register ───────────────────────────────────────────────────────────────

  describe('register', () => {
    it('registers a new patient and returns patient with UHID', async () => {
      repositoryMock.create.mockResolvedValue(mockPatient);

      const result = await service.register(registerPatientDto as never, 'staff-uuid');

      expect(result.message).toBe('Patient registered successfully');
      expect(result.patient.firstName).toBe('Raj');
      expect(result.patient.uhid).toMatch(/^UHID-\d{2}-\d{6}$/);
    });

    it('generates a UHID in the format UHID-YY-XXXXXX', async () => {
      repositoryMock.create.mockResolvedValue(mockPatient);

      await service.register(registerPatientDto as never, 'staff-uuid');

      const uhidArg = repositoryMock.create.mock.calls[0][1];
      expect(uhidArg).toMatch(/^UHID-\d{2}-\d{6}$/);
    });

    it('wraps creation in a transaction', async () => {
      repositoryMock.create.mockResolvedValue(mockPatient);

      await service.register(registerPatientDto as never, 'staff-uuid');

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });

    it('writes an audit log after successful registration', async () => {
      repositoryMock.create.mockResolvedValue(mockPatient);

      await service.register(registerPatientDto as never, 'staff-uuid');

      expect(auditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'Patient',
          entityId: mockPatient.id,
          action: 'CREATE',
          performedBy: 'staff-uuid',
        }),
      );
    });

    it('propagates ConflictException when phone already exists', async () => {
      repositoryMock.create.mockRejectedValue(
        new ConflictException(`Patient with phone ${registerPatientDto.phone} already exists`),
      );

      await expect(
        service.register(registerPatientDto as never, 'staff-uuid'),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── getById ────────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('returns full patient profile when found', async () => {
      repositoryMock.findById.mockResolvedValue(mockPatientFull as never);

      const result = await service.getById(mockPatient.id);

      expect(result.id).toBe(mockPatient.id);
      expect(result.emergencyContacts).toHaveLength(1);
    });

    it('throws NotFoundException when patient does not exist', async () => {
      repositoryMock.findById.mockRejectedValue(
        new NotFoundException(`Patient with id "bad-id" not found`),
      );

      await expect(service.getById('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ── searchByPhone ──────────────────────────────────────────────────────────

  describe('searchByPhone', () => {
    it('returns matching patients and total count', async () => {
      repositoryMock.searchByPhone.mockResolvedValue([mockPatient, mockPatient]);

      const result = await service.searchByPhone('+9198765');

      expect(result.patients).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('returns empty array when no patients match', async () => {
      repositoryMock.searchByPhone.mockResolvedValue([]);

      const result = await service.searchByPhone('+9100000');

      expect(result.patients).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // ── softDelete ─────────────────────────────────────────────────────────────

  describe('softDelete', () => {
    it('deactivates patient and writes DELETE audit log', async () => {
      repositoryMock.findById.mockResolvedValue(mockPatientFull as never);
      repositoryMock.softDelete.mockResolvedValue({ ...mockPatient, isActive: false });

      const result = await service.softDelete(mockPatient.id, 'admin-uuid');

      expect(result.message).toBe('Patient deactivated successfully');
      expect(repositoryMock.softDelete).toHaveBeenCalledWith(mockPatient.id);
      expect(auditMock.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE', performedBy: 'admin-uuid' }),
      );
    });

    it('throws NotFoundException when patient does not exist', async () => {
      repositoryMock.findById.mockRejectedValue(new NotFoundException('not found'));

      await expect(service.softDelete('bad-id', 'admin-uuid')).rejects.toThrow(NotFoundException);
    });
  });
});
